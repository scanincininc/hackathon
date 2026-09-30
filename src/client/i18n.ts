/**
 * Every user-facing string lives here, so translation is a data change rather
 * than a code change. Spanish is not decorative in this domain: the referral
 * notes ask for bilingual workers by name.
 *
 * `dir` carries the writing direction so an RTL locale can be added without
 * touching a component.
 */
import { createContext, useContext } from "react";

export type Locale = "en" | "es";

export interface LocaleMeta {
  label: string;
  dir: "ltr" | "rtl";
}

export const LOCALES: Record<Locale, LocaleMeta> = {
  en: { label: "English", dir: "ltr" },
  es: { label: "Español", dir: "ltr" },
};

const en = {
  "app.title": "Iris referral matching",
  "app.language": "Language",
  "app.offline": "Offline — you can plan, but assigning needs a connection.",
  "app.online": "Connected",
  "app.loading": "Loading…",
  "app.error": "Something went wrong: {message}",
  "app.back": "Back to the queue",
  "app.home": "Start page",

  "welcome.title": "Referral triage for Indiana DCS",
  "welcome.lede":
    "Referrals arrive by email. Iris parses them, checks every worker against the role, county, capacity and active-status rules, and proposes who should take each one — showing its reasoning rather than a score. A supervisor decides.",
  "welcome.enter": "Open the supervisor queue",
  "welcome.tryTitle": "Try it end to end",
  "welcome.step1": "Send a referral email into the demo inbox, or use the 30 already seeded there.",
  "welcome.step2": "Open the queue and press Sync mail to pull the inbox in and plan the whole set.",
  "welcome.step3":
    "Open a case, read why a worker was recommended, explore who else could take it, then assign or decline.",
  "welcome.linksTitle": "Where things live",
  "welcome.mailpit": "Demo inbox (Mailpit)",
  "welcome.mailpitDetail":
    "The referral mailbox Iris reads. Send a message here to watch a new case appear.",
  "welcome.repo": "Source code",
  "welcome.repoDetail": "The matching engine, the planner, and the tests that pin their behaviour.",
  "welcome.boundary": "Plan anywhere, commit connected — everything except assigning works offline.",

  "mode.plan": "Plan",
  "mode.recommend": "Recommend",
  "mode.explore": "Explore",
  "mode.sheet": "Case sheet",
  "mode.kpi": "KPI",

  "queue.heading": "Pending referrals",
  "queue.count": "{count} referrals",
  "queue.countFiltered": "{count} of {total} referrals",

  "filter.search": "Search",
  "filter.searchHint": "Referral, case number, county or worker",
  "filter.all": "All",
  "filter.sort": "Sort by",
  "filter.none": "No referrals match these filters.",

  "sort.deadline": "Deadline",
  "sort.referralId": "Referral",
  "sort.service": "Service",
  "sort.county": "County",
  "sort.outcome": "Outcome",

  "table.referral": "Referral",
  "table.outcome": "Outcome",
  "table.proposed": "Proposed worker",
  "table.deadline": "Response due",
  "queue.sync": "Reload sample referrals",
  "queue.replan": "Replan",
  "queue.empty": "Nothing pending. Sync to pull referrals from the inbox.",
  "queue.deadline": "Respond by {date}",
  "queue.overdue": "Overdue since {date}",
  "queue.dueToday": "Due today",
  "queue.dueIn": "{days} days left",
  "queue.proposed": "Proposed: {name}",
  "queue.unassigned": "No worker proposed",
  "queue.pinned": "Committed — the planner cannot move this",
  "queue.open": "Open {referral}",

  "contention.title": "{count} workers are over-subscribed",
  "contention.titleOne": "1 worker is over-subscribed",
  "contention.line": "{staff}: {slots} slot(s) free, wanted by {wanted} referrals",
  "contention.show": "Show contention",
  "contention.hide": "Hide contention",
  "contention.none": "No worker is over-subscribed right now.",

  "outcome.match": "Match",
  "outcome.no_capacity": "No capacity",
  "outcome.no_eligible_staff": "No eligible staff",
  "outcome.needs_judgment": "Judgment call",
  "outcome.declined": "Declined",

  "status.pending": "Pending",
  "status.proposed": "Proposed",
  "status.assigned": "Assigned",
  "status.declined": "Declined",
  "status.needs_re_decision": "Needs a fresh decision",

  "case.service": "Service",
  "case.county": "County",
  "case.caseNumber": "Case number",
  "case.startDate": "Requested start",
  "case.children": "Children in home",
  "case.fcm": "Family case manager",
  "case.notes": "Referral notes",
  "case.rawEmail": "Original email",
  "case.presence": "{count} others have this case open",
  "case.presenceOne": "1 other person has this case open",

  "notes.title": "Shared notes",
  "notes.empty": "No notes yet. Notes work offline and merge when you reconnect.",
  "notes.placeholder": "Add a note for the next person to read this case",
  "notes.add": "Add note",

  "recommend.title": "Recommended worker",
  "recommend.none": "No worker can be recommended",
  "recommend.why": "Why",
  "recommend.runnersUp": "Runners-up",
  "recommend.judgment":
    "This service is a supervisor judgment call. Candidates are listed; the planner deliberately elects nobody.",
  "recommend.contention": "Contention",

  "explore.title": "Every worker, and why",
  "explore.blocked": "Blocked",
  "explore.eligible": "Eligible",
  "explore.summary": "{eligible} of {total} workers pass every gate",
  "explore.score": "Language {language} · Availability {availability} · Fairness {fairness}",
  "explore.language": "Language {value}",
  "explore.availability": "Availability {value}",
  "explore.fairness": "Fairness {value}",
  "explore.total": "Total {value}",
  "explore.propose": "Propose {name}",
  "explore.proposeBlocked": "Blocked — cannot be proposed",

  "sheet.title": "Referral as recorded",
  "sheet.showRaw": "Show the original email",
  "sheet.hideRaw": "Hide the original email",
  "sheet.noRaw": "The original email body was not stored for this referral.",

  "reason.detail": "Anything else worth recording (optional)",

  "gate.active": "Active",
  "gate.role": "Role",
  "gate.county": "County",
  "gate.capacity": "Capacity",

  "fairness.label": "Fairness policy",
  "fairness.off": "Off — best preference match",
  "fairness.balance": "Balance — spread the work",
  "fairness.balance-first": "Balance first — headroom wins",
  "fairness.help": "Fairness competes with preference matching. Changing it re-ranks live.",

  "unknowns.title": "What this cannot tell you",

  "action.assign": "Assign {name}",
  "action.assignNobody": "Assign",
  "action.decline": "Decline",
  "action.confirmAssign": "Confirm assignment",
  "action.confirmDecline": "Confirm decline",
  "action.cancel": "Cancel",
  "action.working": "Committing…",
  "action.assigning": "Assigning…",
  "action.offline": "Assigning needs a connection",
  "action.knockOn": "This will take the last slot others were waiting on: {referrals}",
  "action.overrideReason": "Why are you overriding the recommendation?",
  "action.declineReason": "Why is this being declined?",
  "action.committed": "Committed: {status}",
  "action.rejected": "The server refused: {message}",

  "decline.no_capacity": "No provider with capacity in county",
  "decline.no_qualified": "No qualified provider for this service",
  "decline.out_of_area": "Family is outside the service area",
  "decline.duplicate": "Duplicate referral",
  "decline.family_declined": "Family declined the service",
  "decline.other": "Other",

  "override.better_fit": "Better fit for this family",
  "override.continuity": "Continuity — already knows the family",
  "override.language": "Language or cultural match",
  "override.schedule": "Schedule fits the family better",
  "override.other": "Other",

  "kpi.title": "Declines per week by service line",
  "kpi.none": "No declines recorded yet.",
  "kpi.week": "Week",
  "kpi.service": "Service line",
  "kpi.declines": "Declines",
  "kpi.gapTitle": "Outcomes by service line",
} as const;

export type MessageKey = keyof typeof en;

/**
 * Spanish covers the supervisor-facing surface. Untranslated keys fall back to
 * English rather than rendering a raw key at a supervisor.
 */
const es: Partial<Record<MessageKey, string>> = {
  "app.title": "Emparejamiento de derivaciones Iris",
  "app.language": "Idioma",
  "app.offline": "Sin conexión — puede planificar, pero asignar requiere conexión.",
  "app.online": "Conectado",
  "app.loading": "Cargando…",
  "app.back": "Volver a la cola",
  "welcome.title": "Clasificación de derivaciones para DCS de Indiana",
  "welcome.lede":
    "Las derivaciones llegan por correo. Iris las interpreta, evalúa a cada profesional según las reglas de función, condado, capacidad y estado activo, y propone quién debería atender cada caso — mostrando su razonamiento en lugar de una puntuación. Decide el supervisor.",
  "welcome.enter": "Abrir la cola del supervisor",
  "welcome.tryTitle": "Pruébelo de principio a fin",
  "welcome.step1":
    "Envíe un correo de derivación al buzón de demostración, o use las 30 ya cargadas.",
  "welcome.step2":
    "Abra la cola y pulse Sincronizar correo para incorporar el buzón y planificar todo el conjunto.",
  "welcome.step3":
    "Abra un caso, lea por qué se recomendó a esa persona, explore quién más podría atenderlo y asigne o rechace.",
  "welcome.linksTitle": "Dónde está cada cosa",
  "welcome.mailpit": "Buzón de demostración (Mailpit)",
  "welcome.mailpitDetail":
    "El buzón de derivaciones que lee Iris. Envíe un mensaje aquí para ver aparecer un caso nuevo.",
  "welcome.repo": "Código fuente",
  "welcome.repoDetail":
    "El motor de emparejamiento, el planificador y las pruebas que fijan su comportamiento.",
  "welcome.boundary":
    "Planifique en cualquier lugar, confirme con conexión — todo excepto asignar funciona sin conexión.",
  "mode.plan": "Plan",
  "mode.recommend": "Recomendar",
  "mode.explore": "Explorar",
  "mode.sheet": "Ficha del caso",
  "mode.kpi": "Indicadores",
  "queue.heading": "Derivaciones pendientes",
  "queue.count": "{count} derivaciones",
  "queue.countFiltered": "{count} de {total} derivaciones",

  "filter.search": "Buscar",
  "filter.searchHint": "Derivación, número de caso, condado o trabajador",
  "filter.all": "Todos",
  "filter.sort": "Ordenar por",
  "filter.none": "Ninguna derivación coincide con estos filtros.",

  "sort.deadline": "Fecha límite",
  "sort.referralId": "Derivación",
  "sort.service": "Servicio",
  "sort.county": "Condado",
  "sort.outcome": "Resultado",

  "table.referral": "Derivación",
  "table.outcome": "Resultado",
  "table.proposed": "Trabajador propuesto",
  "table.deadline": "Respuesta debida",
  "queue.sync": "Recargar referencias de ejemplo",
  "queue.replan": "Replanificar",
  "queue.deadline": "Responder antes del {date}",
  "queue.overdue": "Vencida desde el {date}",
  "queue.dueToday": "Vence hoy",
  "queue.dueIn": "Quedan {days} días",
  "queue.proposed": "Propuesto: {name}",
  "queue.unassigned": "Ningún trabajador propuesto",
  "queue.pinned": "Comprometido — el planificador no puede moverlo",
  "outcome.match": "Coincidencia",
  "outcome.no_capacity": "Sin capacidad",
  "outcome.no_eligible_staff": "Sin personal elegible",
  "outcome.needs_judgment": "Criterio del supervisor",
  "outcome.declined": "Rechazada",
  "recommend.title": "Trabajador recomendado",
  "recommend.why": "Por qué",
  "recommend.runnersUp": "Segundas opciones",
  "explore.title": "Todo el personal, y por qué",
  "unknowns.title": "Lo que esto no puede decirle",
  "action.decline": "Rechazar",
  "action.cancel": "Cancelar",
};

const CATALOGUE: Record<Locale, Partial<Record<MessageKey, string>>> = { en, es };

export type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

export function translator(locale: Locale): Translate {
  return (key, values) => {
    const template = CATALOGUE[locale][key] ?? en[key];
    if (!values) return template;
    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };
}

export interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

export const I18nContext = createContext<I18nValue>({
  locale: "en",
  setLocale: () => undefined,
  t: translator("en"),
});

export const useI18n = (): I18nValue => useContext(I18nContext);

/** Dates and numbers follow the chosen locale, not the developer's machine. */
export const formatDate = (locale: Locale, iso: string | null | undefined): string =>
  iso ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso)) : "—";

export const formatNumber = (locale: Locale, value: number): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
