import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  GROWTH_XP_BASE,
  GROWTH_XP_PER_ADVENTURE,
  GROWTH_XP_PER_MAJOR_ADVENTURE,
  HP_DAILY_LOSS_FRACTION,
  POOL_POINTS_PER_STAT_POINT,
  STAT_MAX,
} from "@/lib/game/constants";

export default async function HelpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const backHref = user ? "/dashboard" : "/sign-in";
  const backLabel = user ? "Back to Dashboard" : "Back to sign in";

  return (
    <div className="pt-5">
      <div className="card">
        <h2 className="text-lg font-semibold">Help &amp; tutorial</h2>
        <p className="mt-1 text-sm text-muted">
          A quick reference for the vocabulary this app uses, then a step-by-step walkthrough for
          both Solo and Party / System setups.
        </p>
        <div className="mt-2">
          <Link href={backHref} className="btn ghost small">
            {backLabel}
          </Link>
        </div>
        <hr className="my-4 border-border" />
        <p className="mb-1 text-sm text-muted">
          <strong>Jump to:</strong>
        </p>
        <p className="text-sm text-muted">
          <a href="#help-concepts" className="underline">
            Concepts
          </a>{" "}
          ·{" "}
          <a href="#help-solo" className="underline">
            Solo walkthrough
          </a>{" "}
          ·{" "}
          <a href="#help-party" className="underline">
            Party / System walkthrough
          </a>{" "}
          ·{" "}
          <a href="#help-deploy" className="underline">
            Accounts &amp; deployment
          </a>
        </p>
      </div>

      <div className="card mt-4" id="help-concepts">
        <h3 className="font-semibold">Concepts</h3>

        <h4 className="mb-1 mt-3.5 font-medium">HP, SP, MP — your vital resources</h4>
        <p className="text-sm text-muted">
          Health (HP), Stamina (SP), and Mana (MP) are the three pools tracked on the Dashboard.
          Each pool&apos;s maximum is your average Physical Stat × {POOL_POINTS_PER_STAT_POINT} —
          grow your stats in the Record of Adventure and all three ceilings rise together. HP
          drains at a steady {HP_DAILY_LOSS_FRACTION * 100}% of its max per day. SP (task energy)
          and MP (decision energy) taper down toward a daily low as the day goes on, and can also
          be spent faster on purpose using Actions &amp; Spells (see below). Everything refills at
          the next &quot;start of day,&quot; which you set in Settings.
        </p>

        <h4 className="mb-1 mt-3.5 font-medium">Physical Stats</h4>
        <p className="text-sm text-muted">
          Strength, Endurance, Coordination, Memory, and Precision, each capped at {STAT_MAX} for
          now. These only change through the Record of Adventure growth log (see below) — never
          by manually dragging a slider — so increases stay tied to something real that happened.
        </p>

        <h4 className="mb-1 mt-3.5 font-medium">Main Role &amp; Masks (Sub-Roles)</h4>
        <p className="text-sm text-muted">
          Your Main Role (Explorer, Builder, Creator, Ruler, Guardian, Teacher, or Other) is the
          mode you operate in most naturally. Masks are the sub-roles you wear in specific
          environments (e.g. &quot;Professional mask&quot; at the office), each with a Mana-cost
          multiplier for how much extra effort that environment costs you compared to your
          natural role. Manage masks in Settings; mark which ones are active today during
          check-in.
        </p>

        <h4 className="mb-1 mt-3.5 font-medium">Buffs &amp; Debuffs</h4>
        <p className="text-sm text-muted">
          Environmental factors that help (buffs) or drain (debuffs) you — sensory, cognitive,
          social, physiological, or systemic. Toggle them from the Buffs &amp; debuffs tab; add
          your own from Settings.
        </p>

        <h4 className="mb-1 mt-3.5 font-medium">Record of Adventure (Growth Log)</h4>
        <p className="text-sm text-muted">
          Where Physical Stat increases actually happen — but not instantly. Each documented
          entry adds XP toward your next point in that stat ({GROWTH_XP_PER_ADVENTURE} XP
          normally, {GROWTH_XP_PER_MAJOR_ADVENTURE} XP for a major, documented recovery event).
          The first point only takes {GROWTH_XP_BASE} XP, but every point after that needs more
          than the last, so growth stays slow and meaningful rather than instant — an anti-abuse
          gate against stat inflation for its own sake. Only one XP-earning entry per stat per day
          counts.
        </p>

        <h4 className="mb-1 mt-3.5 font-medium">Quests</h4>
        <p className="text-sm text-muted">
          Gentle, suggested recovery activities (rest, quiet blocks, noticing a buff) you can mark
          complete. No streaks, no penalties for skipping a day.
        </p>

        <h4 className="mb-1 mt-3.5 font-medium">Actions &amp; Spells</h4>
        <p className="text-sm text-muted">
          Named things you create in Settings that cost Stamina (Actions) or Mana (Spells) on
          demand — like &quot;Generate a work presentation&quot; for 5 Mana. The cost shown
          adjusts automatically based on whichever of your active masks currently has the highest
          multiplier, so the same Spell can cost more on a high-multiplier day. Use them from the
          Dashboard any time, not just during check-in.
        </p>

        <h4 className="mb-1 mt-3.5 font-medium">History &amp; Undo</h4>
        <p className="text-sm text-muted">
          Every check-in, growth entry, buff/debuff toggle, quest completion, and Action/Spell use
          is logged to History. Past check-ins can be edited, and the single most recent change
          can always be undone from the History tab.
        </p>

        <h4 className="mb-1 mt-3.5 font-medium">Solo vs. Party / System mode</h4>
        <p className="text-sm text-muted">
          Solo mode is one Character for the whole account. Party / System mode supports multiple
          Characters (headmates, alters, parts) sharing one account, with switching
          (&quot;fronting&quot;) tracked over time and every change attributed to whichever
          Character made it. Switch modes anytime from Settings. The account-level Party name
          never has to match any individual Character&apos;s name.
        </p>
      </div>

      <div className="card mt-4" id="help-solo">
        <h3 className="font-semibold">Walkthrough: Solo setup</h3>
        <p className="mb-2 text-sm text-muted">A typical first session for a single-Character account.</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>
            Sign in (Discord or guest) and confirm Settings → Mode is set to{" "}
            <strong>Solo character</strong>.
          </li>
          <li>
            In Settings, set your <strong>Display name</strong> and click Save, then set your
            day&apos;s <strong>Start of day</strong> to around when you naturally wake up.
          </li>
          <li>
            Still in Settings, add one or two <strong>masks</strong> (e.g. &quot;Work
            mask&quot;) with a rough Mana multiplier, and any <strong>buffs/debuffs</strong> you
            expect to track.
          </li>
          <li>Back on the Dashboard, watch your HP/SP/MP bars — they&apos;re already draining on the schedule you set.</li>
          <li>
            Click <strong>Do today&apos;s check-in</strong> to log your current role, active
            masks, and buffs/debuffs for the day.
          </li>
          <li>
            Try <strong>Use an action or spell</strong> on the Dashboard to spend some Stamina or
            Mana on something specific — notice the cost shift if you have an active mask with a
            multiplier above 1x.
          </li>
          <li>
            Visit <strong>Suggested quests</strong> and mark one complete when you actually do
            it.
          </li>
          <li>
            When something real changes for you, log it in <strong>Record of Adventure</strong>{" "}
            to add XP toward your next Physical Stat point.
          </li>
          <li>
            Check <strong>History</strong> to see everything logged so far, and confirm{" "}
            <strong>Undo last change</strong> reverts your most recent entry.
          </li>
        </ol>
      </div>

      <div className="card mt-4" id="help-party">
        <h3 className="font-semibold">Walkthrough: Party / System setup</h3>
        <p className="mb-2 text-sm text-muted">
          For accounts representing a system (DID/OSDD) or any multi-Character party.
        </p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>
            In Settings → Mode, switch to <strong>Party / system</strong>. The header now shows a
            row of Character pills instead of a single name.
          </li>
          <li>
            Set the <strong>Party name</strong> for the account/collective as a whole — it&apos;s
            independent of any Character&apos;s name and never has to match one.
          </li>
          <li>
            Under <strong>Characters in this system</strong>, add a second Character with their
            own name and Main Role. Each Character gets fully independent stats, pools, masks,
            buffs, and Actions/Spells.
          </li>
          <li>
            Click a Character&apos;s pill in the header (or use <strong>Switch to</strong> on
            their row in Settings) to change who&apos;s active/fronting — this is logged to the
            Switch Log.
          </li>
          <li>
            Do a check-in, log growth, toggle a buff, or use an Action/Spell while each Character
            is active — everything is attributed to whichever Character was front at the time.
          </li>
          <li>
            On the Dashboard, review <strong>Recent party activity</strong> and{" "}
            <strong>Recent fronting</strong> to see the combined picture across everyone.
          </li>
          <li>
            On the History tab, use the <strong>Mine / Party</strong> toggle to see just the
            active Character&apos;s entries or everyone&apos;s.
          </li>
        </ol>
      </div>

      <div className="card mt-4" id="help-deploy">
        <h3 className="font-semibold">Accounts &amp; deployment</h3>
        <p className="text-sm text-muted">
          Sign-in runs on real Supabase Auth — Discord OAuth or an anonymous guest session — and
          everything you enter is saved to your account. The full product and deployment plan
          lives in the project&apos;s <code>audhd_adventure_spec.md</code> document, which covers
          the data model, Discord OAuth setup, and hosting on Vercel + Supabase.
        </p>
      </div>
    </div>
  );
}
