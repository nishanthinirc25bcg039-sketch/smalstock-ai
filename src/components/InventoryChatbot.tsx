import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, CheckCircle2, Send, ShieldCheck, User, X } from 'lucide-react';
import {
  ChatMessage,
  ChatProposedAction,
  Product,
  PurchaseOrder,
  StockTransaction,
  Supplier,
} from '../types/inventory';
import { answerInventoryQuestion } from '../utils/aiEngine';
import { formatCurrency } from '../utils/inventoryEngine';

interface InventoryChatbotProps {
  open: boolean;
  products: Product[];
  transactions: StockTransaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onClose: () => void;
  onConfirmProposedAction: (action: ChatProposedAction) => void;
}

const SUGGESTED_QUESTIONS = [
  'What needs reordering?',
  'What is my inventory worth?',
  'Which products are selling faster?',
  'Any supplier delivery delays?',
];

export function InventoryChatbot({
  open,
  products,
  transactions,
  suppliers,
  purchaseOrders,
  onClose,
  onConfirmProposedAction,
}: InventoryChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hi! I can answer questions about your displayed sample inventory — valuations, low-stock items, selling speed, and supplier status. I never modify stock or create orders unless you explicitly confirm.',
      timestamp: 'Now',
      isGuidanceOnly: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages, isTyping]);

  if (!open) return null;

  const askQuestion = (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = answerInventoryQuestion(
        trimmed,
        products,
        transactions,
        suppliers,
        purchaseOrders
      );
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply.text,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isGuidanceOnly: true,
        proposedAction: reply.proposedAction,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 320);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    askQuestion(input);
  };

  const handleConfirmAction = (messageId: string, action: ChatProposedAction) => {
    onConfirmProposedAction(action);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.proposedAction
          ? {
              ...m,
              proposedAction: { ...m.proposedAction, confirmed: true },
            }
          : m
      )
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chatbot-title"
    >
      <div className="bg-white w-full max-w-md h-full border-l border-slate-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Bot className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="chatbot-title" className="font-display text-base font-bold text-slate-900">
                Inventory Assistant
              </h2>
              <p className="text-xs text-slate-500">
                Sample-data AI guidance · Read-only until confirmed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inventory chatbot"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Suggested Chips */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <p className="text-[11px] font-medium text-slate-500 mb-2">Suggested questions</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => askQuestion(q)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-orange-400 hover:text-orange-700 rounded-lg transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {!isUser && msg.isGuidanceOnly && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                      <span>AI guidance based on displayed sample data · {msg.timestamp}</span>
                    </p>
                  )}

                  {msg.proposedAction && (
                    <div className="p-3 rounded-xl border border-orange-200 bg-orange-50/60 space-y-2">
                      <p className="text-xs font-semibold text-slate-900">
                        Optional Action (Requires Confirmation)
                      </p>
                      <p className="text-xs text-slate-700">
                        Draft PO: {msg.proposedAction.quantity}× {msg.proposedAction.productName}{' '}
                        from {msg.proposedAction.supplierName} (Est.{' '}
                        {formatCurrency(msg.proposedAction.estimatedCost)})
                      </p>
                      {msg.proposedAction.confirmed ? (
                        <p className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Confirmed & added to Purchase Orders</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConfirmAction(msg.id, msg.proposedAction!)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                        >
                          Confirm & Create Purchase Order
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-slate-500" aria-hidden="true" />
              </div>
              <span className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                Analyzing current sample inventory...
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              aria-label="Ask inventory assistant"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about stock value, reorders, or trends..."
              className="flex-1 px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send question"
              className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
