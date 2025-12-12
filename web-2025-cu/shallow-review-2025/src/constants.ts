import type { OrthodoxProblem, TargetCase, BroadApproach } from './types';

export const ORTHODOX_PROBLEMS: Record<string, OrthodoxProblem> = {
    "value_fragile": {
        "name": "Value is fragile and hard to specify",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#1__Value_is_fragile_and_hard_to_specify",
    },
    "corrigibility_anti_natural": {
        "name": "Corrigibility is anti-natural",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#2__Corrigibility_is_anti_natural",
    },
    "pivotal_dangerous_capabilities": {
        "name": "Pivotal processes require dangerous capabilities",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#3__Pivotal_processes_require_dangerous_capabilities",
    },
    "goals_misgeneralize": {
        "name": "Goals misgeneralize out of distribution",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#4__Goals_misgeneralize_out_of_distribution",
    },
    "instrumental_convergence": {
        "name": "Instrumental convergence",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#5__Instrumental_convergence",
    },
    "pivotal_incomprehensible_plans": {
        "name": "Pivotal processes likely require incomprehensibly complex plans",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#6__Pivotal_processes_likely_require_incomprehensibly_complex_plans",
    },
    "superintelligence_fool_supervisors": {
        "name": "Superintelligence can fool human supervisors",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#7__Superintelligence_can_fool_human_supervisors",
    },
    "superintelligence_hack_software": {
        "name": "Superintelligence can hack software supervisors",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#8__Superintelligence_can_hack_software_supervisors",
    },
    "humans_not_first_class": {
        "name": "Humans cannot be first-class parties to a superintelligent value handshake",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#9__Humans_cannot_be_first_class_parties_to_a_superintelligent_value_handshake",
    },
    "humanlike_minds_not_safe": {
        "name": "Humanlike minds/goals are not necessarily safe",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#10__Humanlike_minds_goals_are_not_necessarily_safe",
    },
    "someone_else_deploys": {
        "name": "Someone else will deploy unsafe superintelligence first",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#11__Someone_else_will_deploy_unsafe_superintelligence_first",
    },
    "boxed_agi_exfiltrate": {
        "name": "A boxed AGI might exfiltrate itself by steganography, spearphishing",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#12__A_boxed_AGI_might_exfiltrate_itself_by_steganography__spearphishing",
    },
    "fair_sane_pivotal": {
        "name": "Fair, sane pivotal processes",
        "url": "https://www.alignmentforum.org/posts/mnoc3cKY3gXMrTybs/a-list-of-core-ai-safety-problems-and-how-i-hope-to-solve#13__Fair__sane_pivotal_processes",
    },
};

export const TARGET_CASES: Record<string, TargetCase> = {
    "average_case": {
        "name": "Average-case",
        "url": "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
    },
    "pessimistic_case": {
        "name": "Pessimistic-case",
        "url": "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
    },
    "worst_case": {
        "name": "Worst-case",
        "url": "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
    },
};

export const BROAD_APPROACHES: Record<string, BroadApproach> = {
    "engineering": {
        "name": "Engineering",
        "url": "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
    },
    "behaviorist_science": {
        "name": "Behaviorist science",
        "url": "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
    },
    "cognitivist_science": {
        "name": "Cognitivist science",
        "url": "https://www.lesswrong.com/posts/67fNBeHrjdrZZNDDK/defining-alignment-research#A_better_definition_of_alignment_research",
    },
};

