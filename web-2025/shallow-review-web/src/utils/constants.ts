/**
 * Constants for shallow review taxonomy
 * Converted from draft_types.py
 */

// ============================================================================
// Orthodox Problems
// ============================================================================

export interface TaxonomyItem {
  name: string;
  url: string;
}

// Orthodox Problems from "A list of core AI safety problems"
// Source: https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve
export const ORTHODOX_PROBLEMS: Record<string, TaxonomyItem> = {
  value_fragile: {
    name: "Value is fragile and hard to specify",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#1__Value_is_fragile_and_hard_to_specify",
  },
  corrigibility_anti_natural: {
    name: "Corrigibility is anti-natural",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#2__Corrigibility_is_anti_natural",
  },
  pivotal_dangerous_capabilities: {
    name: "Pivotal processes require dangerous capabilities",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#3__Pivotal_processes_require_dangerous_capabilities",
  },
  goals_misgeneralize: {
    name: "Goals misgeneralize out of distribution",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#4__Goals_misgeneralize_out_of_distribution",
  },
  instrumental_convergence: {
    name: "Instrumental convergence",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#5__Instrumental_convergence",
  },
  pivotal_incomprehensible_plans: {
    name: "Pivotal processes likely require incomprehensibly complex plans",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#6__Pivotal_processes_likely_require_incomprehensibly_complex_plans",
  },
  superintelligence_fool_supervisors: {
    name: "Superintelligence can fool human supervisors",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#7__Superintelligence_can_fool_human_supervisors",
  },
  superintelligence_hack_software: {
    name: "Superintelligence can hack software supervisors",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#8__Superintelligence_can_hack_software_supervisors",
  },
  humans_not_first_class: {
    name: "Humans cannot be first-class parties to a superintelligent value handshake",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#9__Humans_cannot_be_first_class_parties_to_a_superintelligent_value_handshake",
  },
  humanlike_minds_not_safe: {
    name: "Humanlike minds/goals are not necessarily safe",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#10__Humanlike_minds_goals_are_not_necessarily_safe",
  },
  someone_else_deploys: {
    name: "Someone else will deploy unsafe superintelligence first",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#11__Someone_else_will_deploy_unsafe_superintelligence_first",
  },
  boxed_agi_exfiltrate: {
    name: "A boxed AGI might exfiltrate itself by steganography, spearphishing",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#12__A_boxed_AGI_might_exfiltrate_itself_by_steganography__spearphishing",
  },
  fair_sane_pivotal: {
    name: "Fair, sane pivotal processes",
    url: "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#13__Fair__sane_pivotal_processes",
  },
};

// ============================================================================
// Target Cases
// ============================================================================

// Target Cases from "Defining alignment research"
// Source: https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research
export const TARGET_CASES: Record<string, TaxonomyItem> = {
  average_case: {
    name: "Average-case",
    url: "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
  },
  pessimistic_case: {
    name: "Pessimistic-case",
    url: "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
  },
  worst_case: {
    name: "Worst-case",
    url: "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
  },
};

// ============================================================================
// Broad Approaches
// ============================================================================

// Broad Approaches from "Defining alignment research"
// Source: https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research
export const BROAD_APPROACHES: Record<string, TaxonomyItem> = {
  engineering: {
    name: "Engineering",
    url: "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
  },
  behaviorist_science: {
    name: "Behaviorist science",
    url: "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
  },
  cognitivist_science: {
    name: "Cognitivist science",
    url: "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
  },
};

// ============================================================================
// Placeholder Descriptions (to be replaced with actual content later)
// ============================================================================

export const APPROACH_DESCRIPTIONS: Record<string, string> = {
  engineering: "Placeholder description for Engineering approach.",
  behaviorist_science: "Placeholder description for Behaviorist science approach.",
  cognitivist_science: "Placeholder description for Cognitivist science approach.",
};

export const CASE_DESCRIPTIONS: Record<string, string> = {
  average_case: "Placeholder description for Average-case scenario.",
  pessimistic_case: "Placeholder description for Pessimistic-case scenario.",
  worst_case: "Placeholder description for Worst-case scenario.",
};

export const PROBLEM_DESCRIPTIONS: Record<string, string> = {
  value_fragile: "Placeholder description for Value is fragile and hard to specify.",
  corrigibility_anti_natural: "Placeholder description for Corrigibility is anti-natural.",
  pivotal_dangerous_capabilities: "Placeholder description for Pivotal processes require dangerous capabilities.",
  goals_misgeneralize: "Placeholder description for Goals misgeneralize out of distribution.",
  instrumental_convergence: "Placeholder description for Instrumental convergence.",
  pivotal_incomprehensible_plans: "Placeholder description for Pivotal processes likely require incomprehensibly complex plans.",
  superintelligence_fool_supervisors: "Placeholder description for Superintelligence can fool human supervisors.",
  superintelligence_hack_software: "Placeholder description for Superintelligence can hack software supervisors.",
  humans_not_first_class: "Placeholder description for Humans cannot be first-class parties to a superintelligent value handshake.",
  humanlike_minds_not_safe: "Placeholder description for Humanlike minds/goals are not necessarily safe.",
  someone_else_deploys: "Placeholder description for Someone else will deploy unsafe superintelligence first.",
  boxed_agi_exfiltrate: "Placeholder description for A boxed AGI might exfiltrate itself by steganography, spearphishing.",
  fair_sane_pivotal: "Placeholder description for Fair, sane pivotal processes.",
};

// ============================================================================
// Symbols for Display
// ============================================================================

export const SYMBOLS = {
  theory_of_change: '≈',
  approach: '⚙',
  case: '◐',
  orthodox_problem: '⚠',
  see_also: '↔',
  names: '☉',
  critiques: '✗',
  funded_by: '$',
  ftes: '⫼',
  outputs: '▹',
};
