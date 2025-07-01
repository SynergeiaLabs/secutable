import OpenAI from 'openai';

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey,
});

export async function generateAfterActionReport({ irpPhases, injects }: {
  irpPhases: { name: string; actions: string[] }[];
  injects: {
    content: string;
    phase_assignment: string;
    activated_at: number;
    handled_at?: number;
    response_time?: number;
    performance_status: string;
  }[];
}): Promise<string> {
  // Format IRP
  const irpText = irpPhases.map(phase =>
    `**${phase.name}**\n- ${phase.actions.join('\n- ')}`
  ).join('\n\n');

  // Format inject logs
  const injectText = injects.map(inj =>
    `- [${inj.performance_status === 'met' ? '✅' : inj.performance_status === 'delayed' ? '⚠️' : '❌'}] (${inj.phase_assignment}) ${inj.content}\n  Activated: ${new Date(inj.activated_at).toLocaleString()}\n  Handled: ${inj.handled_at ? new Date(inj.handled_at).toLocaleString() : 'Not handled'}\n  Response time: ${inj.response_time ? Math.round(inj.response_time/60) + 'm' : 'N/A'}`
  ).join('\n\n');

  const systemPrompt = `You are a cybersecurity tabletop evaluator. Your task is to assess how well a team followed its Incident Response Plan (IRP) during a simulation. Provide clear analysis and specific recommendations.`;

  const userPrompt = `Below is the Incident Response Plan (IRP), organized by phase. Following that is the log of scenario injects, their handling status, and timing.\n\n1. For each IRP phase:\n   - Evaluate whether the team followed the key actions\n   - Highlight specific strengths and lapses\n   - Provide 1–2 specific recommendations to improve the IRP wording, structure, or delegation based on how the phase was handled\n\n2. Conclude with:\n   - Overall performance score (1–10)\n   - Summary of top 3 IRP areas to improve\n\n**IRP:**\n${irpText}\n\n**Inject Logs:**\n${injectText}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 1200,
  });

  return completion.choices[0].message?.content || '';
} 