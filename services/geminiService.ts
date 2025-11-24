import { GoogleGenAI, Type } from "@google/genai";
import { Composition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a world-class composer and sound designer for animation. 
Your goal is to translate a natural language scene description (e.g., "A sad robot walking in the rain") into a structural JSON representation of music using Tone.js concepts.
Do not generate code. Generate pure JSON data describing the sequence.

Rules:
1. BPM: Choose a tempo fitting the mood (e.g., Sad=60-80, Action=120-160).
2. Key: Choose a musical key fitting the mood (e.g., C Major for happy, D Minor for sad).
3. Structure: 
   - 'melody': The main lead line.
   - 'harmony': Chords or pads.
   - 'bass': Low frequency grounding.
   - 'rhythm': Just a metadata flag for now, assume a standard beat based on BPM.
4. Notes: Use standard notation (C4, F#3). Use "time" in "Measure:Quarter:Sixteenth" format (0:0:0 to 3:3:0 for a 4-bar loop).
5. Loop: Create a 4-bar loop (Measures 0 to 3).
6. Instruments: Suggest oscillator types (sine, triangle, sawtooth, square) and envelope settings (attack, decay, sustain, release) that match the timbre of the scene.
   - Soft/Sad: Sine/Triangle, slow attack.
   - Action/Tension: Sawtooth/Square, fast attack.
   - Retro/8-bit: Square with short decay.

Output STRICT JSON matching the schema.
`;

export const composeMusic = async (prompt: string): Promise<Composition> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Scene Description: "${prompt}". Compose a 4-bar looping track.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            bpm: { type: Type.INTEGER },
            key: { type: Type.STRING },
            tracks: {
              type: Type.OBJECT,
              properties: {
                melody: {
                  type: Type.OBJECT,
                  properties: {
                    instrument: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, enum: ['synth', 'am', 'fm', 'duo'] },
                        oscillator: { type: Type.STRING, enum: ['sine', 'square', 'triangle', 'sawtooth'] },
                        envelope: {
                            type: Type.OBJECT,
                            properties: {
                                attack: { type: Type.NUMBER },
                                decay: { type: Type.NUMBER },
                                sustain: { type: Type.NUMBER },
                                release: { type: Type.NUMBER },
                            }
                        }
                      }
                    },
                    notes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING },
                          note: { type: Type.STRING },
                          duration: { type: Type.STRING },
                          velocity: { type: Type.NUMBER },
                        }
                      }
                    }
                  }
                },
                harmony: {
                  type: Type.OBJECT,
                  properties: {
                    instrument: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING, enum: ['poly', 'am', 'fm'] },
                          oscillator: { type: Type.STRING },
                          envelope: {
                              type: Type.OBJECT,
                              properties: {
                                  attack: { type: Type.NUMBER },
                                  decay: { type: Type.NUMBER },
                                  sustain: { type: Type.NUMBER },
                                  release: { type: Type.NUMBER },
                              }
                          }
                        }
                      },
                    notes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING },
                          note: { type: Type.ARRAY, items: { type: Type.STRING } },
                          duration: { type: Type.STRING },
                          velocity: { type: Type.NUMBER },
                        }
                      }
                    }
                  }
                },
                bass: {
                  type: Type.OBJECT,
                  properties: {
                    instrument: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING, enum: ['membrane', 'mono', 'am', 'fm'] },
                          oscillator: { type: Type.STRING },
                          envelope: {
                              type: Type.OBJECT,
                              properties: {
                                  attack: { type: Type.NUMBER },
                                  decay: { type: Type.NUMBER },
                                  sustain: { type: Type.NUMBER },
                                  release: { type: Type.NUMBER },
                              }
                          }
                        }
                      },
                    notes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING },
                          note: { type: Type.STRING },
                          duration: { type: Type.STRING },
                          velocity: { type: Type.NUMBER },
                        }
                      }
                    }
                  }
                },
                rhythm: {
                    type: Type.OBJECT,
                    properties: {
                        pattern: { type: Type.STRING },
                        active: { type: Type.BOOLEAN }
                    }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as Composition;
    }
    throw new Error("No music data generated");
  } catch (error) {
    console.error("Gemini Composition Error:", error);
    throw error;
  }
};
