
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const enhanceTaskDescription = async (title: string, type: string): Promise<{ description: string, priority: string, subtasks: string[] }> => {
  if (!apiKey) return { description: "API Key missing.", priority: "Medium", subtasks: [] };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `I am a Business Analyst creating a ${type} task with the title: "${title}". 
      Please provide a professional, concise description for this task, suggest an appropriate priority level (Low, Medium, High, Critical), and a list of 3-5 actionable subtasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            priority: { type: Type.STRING },
            subtasks: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["description", "priority", "subtasks"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      description: "Could not generate description.",
      priority: "Medium",
      subtasks: []
    };
  }
};

export const generateDailyStandup = async (logs: any[], userName: string): Promise<string> => {
  if (!apiKey) return "API Key missing. Cannot generate report.";

  try {
    const logsText = JSON.stringify(logs.slice(0, 20)); // Limit context
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on the following activity logs for user ${userName}, write a short, professional daily standup summary (past tense). Focus on completed items and new assignments.
      Logs: ${logsText}`
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate standup report.";
  }
};

// --- NEW AI FEATURES ---

export const generateAiEmail = async (recipient: string, topic: string, tone: string): Promise<string> => {
  if (!apiKey) return "API Key missing.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Draft a professional email for a Business Analyst.
      Recipient: ${recipient}
      Topic: ${topic}
      Tone: ${tone}
      
      Return only the email body text, no conversational filler.`
    });
    return response.text || "Failed to generate email.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content.";
  }
};

export const generateAiDocumentation = async (title: string, notes: string, format: string = 'Markdown', includeToc: boolean = false, fileContent?: string): Promise<string> => {
  if (!apiKey) return "API Key missing.";
  try {
    const contents = [
      {
        text: `Generate technical documentation for a business process or feature.
        Title: ${title}
        Context/Notes: ${notes}
        Format: ${format}
        ${includeToc ? "Requirements: Include a Table of Contents at the very beginning." : ""}
        
        Ensure the content is well-structured with clear headers and sections appropriate for the selected format.`
      }
    ];

    if (fileContent) {
      contents.push({
        text: `\n\nAdditional Context from Uploaded Document:\n${fileContent.substring(0, 10000)}` // Limit token usage
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents
    });
    return response.text || "Failed to generate documentation.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating content.";
  }
};

export const generateAiInfographic = async (prompt: string, documentContent?: string): Promise<string | null> => {
  if (!apiKey) return null;
  try {
    let enhancedPrompt = prompt;

    // 1. If there's a document, analyze it first to extract visualizable data
    if (documentContent) {
       const analysisResponse = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: `Analyze the following document content and extract the key data points, statistics, process steps, or conceptual relationships that would make a compelling infographic about "${prompt}".
         
         Provide a concise, visual description of how this data should be laid out in an infographic (e.g. "A 4-step circular process...", "A bar chart showing...").
         Keep the description structured for an image generation model.
         
         Document Content: ${documentContent.substring(0, 10000)}`
       });
       enhancedPrompt = `${prompt}. Visual Structure based on data: ${analysisResponse.text}`;
    }

    // 2. Generate image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A professional, clean business infographic. ${enhancedPrompt}` }]
      },
      config: {
          imageConfig: { aspectRatio: "3:4" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
