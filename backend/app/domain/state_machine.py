from enum import Enum


class KnowledgeStateEnum(str, Enum):
    UNSEEN = "UNSEEN"
    EXPOSED = "EXPOSED"
    SHAKY = "SHAKY"
    SOLID = "SOLID"
    STALE = "STALE"


class StateEvent(str, Enum):
    QUESTION_SHOWN = "QUESTION_SHOWN"
    ATTEMPT_MADE = "ATTEMPT_MADE"
    CORRECT = "CORRECT"
    PARTIAL = "PARTIAL"
    WRONG = "WRONG"
    TEACH_BACK_PASSED = "TEACH_BACK_PASSED"
    RETRIEVABILITY_LOW = "RETRIEVABILITY_LOW"


class KnowledgeStateMachine:
    """Pure state machine. No DB access. All methods are synchronous."""

    TRANSITIONS: dict[tuple[KnowledgeStateEnum, StateEvent], KnowledgeStateEnum] = {
        (KnowledgeStateEnum.UNSEEN, StateEvent.QUESTION_SHOWN): KnowledgeStateEnum.EXPOSED,
        (KnowledgeStateEnum.EXPOSED, StateEvent.ATTEMPT_MADE): KnowledgeStateEnum.SHAKY,
        (KnowledgeStateEnum.SHAKY, StateEvent.RETRIEVABILITY_LOW): KnowledgeStateEnum.STALE,
        (KnowledgeStateEnum.SOLID, StateEvent.RETRIEVABILITY_LOW): KnowledgeStateEnum.STALE,
        (KnowledgeStateEnum.STALE, StateEvent.CORRECT): KnowledgeStateEnum.SOLID,
        (KnowledgeStateEnum.STALE, StateEvent.TEACH_BACK_PASSED): KnowledgeStateEnum.SOLID,
    }

    def transition(
        self,
        current_state: KnowledgeStateEnum,
        event: StateEvent,
        correct_count: int = 0,
        sessions_since_first_correct: int = 0,
    ) -> KnowledgeStateEnum:
        """Returns new state after applying event.

        Special rule for SHAKY -> SOLID:
          Trigger when event in (CORRECT, TEACH_BACK_PASSED)
          AND current_state == SHAKY
          AND correct_count >= 3
          AND sessions_since_first_correct >= 2

        All other transitions use the TRANSITIONS table.
        If no transition applies, return current_state unchanged.
        """
        if (
            current_state == KnowledgeStateEnum.SHAKY
            and event in (StateEvent.CORRECT, StateEvent.TEACH_BACK_PASSED)
            and correct_count >= 3
            and sessions_since_first_correct >= 2
        ):
            return KnowledgeStateEnum.SOLID

        return self.TRANSITIONS.get((current_state, event), current_state)

    def can_transition(
        self,
        current_state: KnowledgeStateEnum,
        event: StateEvent,
    ) -> bool:
        """Returns True if any transition exists for this state+event combo."""
        if current_state == KnowledgeStateEnum.SHAKY and event in (
            StateEvent.CORRECT,
            StateEvent.TEACH_BACK_PASSED,
        ):
            return True
        return (current_state, event) in self.TRANSITIONS
