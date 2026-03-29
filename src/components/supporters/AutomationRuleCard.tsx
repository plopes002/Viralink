// src/components/supporters/AutomationRuleCard.tsx
"use client";

type Rule = {
  id: string;
  name: string;
  triggerType: string;
  keywords?: string[];
  actions?: {
    autoReplyPublic?: boolean;
    autoReplyPrivate?: boolean;
    autoConvertToLead?: boolean;
  };
  replyTemplatePublic?: string | null;
  replyTemplatePrivate?: string | null;
  delaySeconds?: number;
  active: boolean;
};

type Props = {
  rule: Rule;
  onRefresh: () => void;
};

export function AutomationRuleCard({ rule, onRefresh }: Props) {
  async function handleToggle() {
    try {
      const res = await fetch("/api/network/automation-rules/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ruleId: rule.id,
          active: !rule.active,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Erro ao atualizar regra.");
      }

      onRefresh();
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar regra.");
    }
  }

  return (
    <div className="rounded-xl border border-[#272046] bg-[#0A0322] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{rule.name}</p>
          <p className="text-xs text-[#9CA3AF]">
            Trigger: {rule.triggerType}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[10px] ${
            rule.active
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {rule.active ? "Ativa" : "Inativa"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        {(rule.keywords || []).map((keyword) => (
          <span
            key={keyword}
            className="px-2 py-1 rounded-full bg-[#111827] text-white"
          >
            {keyword}
          </span>
        ))}
      </div>

      <div className="grid gap-2 text-[11px] text-white">
        <p>
          Resposta pública:{" "}
          {rule.actions?.autoReplyPublic ? "sim" : "não"}
        </p>
        <p>
          Resposta privada:{" "}
          {rule.actions?.autoReplyPrivate ? "sim" : "não"}
        </p>
        <p>
          Converter em lead:{" "}
          {rule.actions?.autoConvertToLead ? "sim" : "não"}
        </p>
        <p>Delay: {rule.delaySeconds || 0}s</p>
      </div>

      {rule.replyTemplatePublic && (
        <div className="rounded-lg border border-[#1F173B] bg-[#050016] p-3">
          <p className="text-[10px] text-[#9CA3AF] mb-1">Resposta pública</p>
          <p className="text-xs text-white">{rule.replyTemplatePublic}</p>
        </div>
      )}

      {rule.replyTemplatePrivate && (
        <div className="rounded-lg border border-[#1F173B] bg-[#050016] p-3">
          <p className="text-[10px] text-[#9CA3AF] mb-1">Resposta privada</p>
          <p className="text-xs text-white">{rule.replyTemplatePrivate}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        className="rounded-xl border border-[#272046] text-xs text-white py-2 hover:bg-[#111827]"
      >
        {rule.active ? "Desativar" : "Ativar"}
      </button>
    </div>
  );
}