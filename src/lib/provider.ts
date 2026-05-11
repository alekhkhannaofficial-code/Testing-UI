import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `I'll create a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Now let me enhance the component with better styling.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `This is a static response. You can place an Anthropic API key in the .env file to use the Anthropic API for component generation. Let me create an App.jsx file to display the component.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Perfect! I've created:

1. **${componentName}.jsx** - A fully-featured ${componentType} component
2. **App.jsx** - The main app file that displays the component

The component is now ready to use. You can see the preview on the right side of the screen.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "card":
        return `import React, { useState } from 'react';

const Card = ({
  quote = "This product completely changed how our team collaborates. The experience is seamless, intuitive, and genuinely delightful to use every single day.",
  author = "Sarah Chen",
  role = "Head of Design",
  company = "Vercel",
  avatarUrl,
  rating = 5,
}) => {
  const [hovered, setHovered] = useState(false);

  const cardStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#ffffff',
    borderRadius: '24px',
    padding: '36px',
    maxWidth: '420px',
    boxShadow: hovered
      ? '0 24px 48px rgba(102,126,234,0.18), 0 6px 16px rgba(0,0,0,0.06)'
      : '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
    transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
  };

  const glowStyle = {
    position: 'absolute',
    top: '-60px',
    right: '-60px',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(102,126,234,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  };

  const quoteMarkStyle = {
    fontSize: '5rem',
    lineHeight: 0.8,
    color: '#667eea',
    fontFamily: 'Georgia, serif',
    marginBottom: '16px',
    display: 'block',
    opacity: 0.6,
  };

  const quoteStyle = {
    fontSize: '1rem',
    lineHeight: 1.75,
    color: '#374151',
    margin: '0 0 28px',
    fontStyle: 'italic',
    letterSpacing: '0.01em',
  };

  const starsStyle = {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
  };

  const dividerStyle = {
    height: '1px',
    background: 'linear-gradient(90deg, #e5e7eb 0%, transparent 100%)',
    marginBottom: '20px',
  };

  const authorRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  };

  const avatarStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#ffffff',
    flexShrink: 0,
    overflow: 'hidden',
  };

  const authorNameStyle = {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 2px',
  };

  const authorMetaStyle = {
    fontSize: '0.8rem',
    color: '#9ca3af',
    margin: 0,
  };

  const initials = author.split(' ').map(n => n[0]).join('');

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={glowStyle} />
      <span style={quoteMarkStyle}>"</span>
      <p style={quoteStyle}>{quote}</p>
      <div style={starsStyle}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < rating ? '#f59e0b' : '#e5e7eb'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      <div style={dividerStyle} />
      <div style={authorRowStyle}>
        <div style={avatarStyle}>
          {avatarUrl
            ? <img src={avatarUrl} alt={author} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div>
          <p style={authorNameStyle}>{author}</p>
          <p style={authorMetaStyle}>{role} · {company}</p>
        </div>
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const wrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 40px',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minWidth: '280px',
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#a78bfa',
    marginBottom: '12px',
  };

  const countStyle = {
    fontSize: '5rem',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1,
    marginBottom: '40px',
    letterSpacing: '-0.04em',
    textShadow: '0 0 40px rgba(167,139,250,0.4)',
  };

  const btnRowStyle = { display: 'flex', gap: '12px' };

  const btn = (id, label, gradient, shadowColor) => ({
    padding: '12px 24px',
    background: hoveredBtn === id ? gradient.hover : gradient.base,
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: hoveredBtn === id ? \`0 8px 20px \${shadowColor}\` : 'none',
    transform: hoveredBtn === id ? 'translateY(-2px)' : 'none',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={wrapStyle}>
      <div style={labelStyle}>Counter</div>
      <div style={countStyle}>{count}</div>
      <div style={btnRowStyle}>
        <button
          style={btn('dec', '−', { base: 'linear-gradient(135deg,#f093fb,#f5576c)', hover: 'linear-gradient(135deg,#f5576c,#f093fb)' }, 'rgba(245,87,108,0.5)')}
          onMouseEnter={() => setHoveredBtn('dec')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => setCount(c => c - 1)}
        >−</button>
        <button
          style={btn('rst', 'Reset', { base: 'rgba(255,255,255,0.1)', hover: 'rgba(255,255,255,0.2)' }, 'rgba(255,255,255,0.1)')}
          onMouseEnter={() => setHoveredBtn('rst')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => setCount(0)}
        >Reset</button>
        <button
          style={btn('inc', '+', { base: 'linear-gradient(135deg,#4facfe,#00f2fe)', hover: 'linear-gradient(135deg,#00f2fe,#4facfe)' }, 'rgba(79,172,254,0.5)')}
          onMouseEnter={() => setHoveredBtn('inc')}
          onMouseLeave={() => setHoveredBtn(null)}
          onClick={() => setCount(c => c + 1)}
        >+</button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);";
      case "card":
        return '      <div className="p-6">';
      default:
        return "  const increment = () => setCount(count + 1);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    console.log('Form submitted:', formData);\n    alert('Thank you! We\\'ll get back to you soon.');";
      case "card":
        return '      <div className="p-6 hover:bg-gray-50 transition-colors">';
      default:
        return "  const increment = () => setCount(prev => prev + 1);";
    }
  }

  private getAppCode(componentName: string): string {
    const appWrapStyle = `{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7ff 0%, #e8ecff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }`;

    if (componentName === "Card") {
      return `import { useState } from 'react';
import Card from '@/components/Card';

export default function App() {
  const [btnHovered, setBtnHovered] = useState(false);
  return (
    <div style={${appWrapStyle}}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Card
          title="Amazing Product"
          description="A beautifully crafted product experience that delights at every interaction."
          actions={
            <button
              style={{
                padding: '12px 28px',
                background: btnHovered ? 'linear-gradient(135deg,#764ba2,#667eea)' : 'linear-gradient(135deg,#667eea,#764ba2)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: btnHovered ? 'scale(1.03)' : 'scale(1)',
                boxShadow: btnHovered ? '0 8px 20px rgba(102,126,234,0.5)' : '0 4px 12px rgba(102,126,234,0.3)',
              }}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
            >
              Learn More
            </button>
          }
        />
      </div>
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div style={${appWrapStyle}}>
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey || apiKey === "your-api-key-here") {
    console.log(
      "ANTHROPIC_API_KEY is not set (or is still the placeholder). " +
        "Using the mock provider — responses will be canned. " +
        "Set a real key in .env to generate components with Claude."
    );
    return new MockLanguageModel("mock-" + MODEL);
  }

  return anthropic(MODEL);
}
