from app.domain.state_machine import KnowledgeStateEnum, KnowledgeStateMachine, StateEvent


def test_unseen_question_shown_becomes_exposed() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(KnowledgeStateEnum.UNSEEN, StateEvent.QUESTION_SHOWN)
    assert result == KnowledgeStateEnum.EXPOSED


def test_exposed_attempt_made_becomes_shaky() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(KnowledgeStateEnum.EXPOSED, StateEvent.ATTEMPT_MADE)
    assert result == KnowledgeStateEnum.SHAKY


def test_shaky_correct_enough_becomes_solid() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(
        KnowledgeStateEnum.SHAKY,
        StateEvent.CORRECT,
        correct_count=3,
        sessions_since_first_correct=2,
    )
    assert result == KnowledgeStateEnum.SOLID


def test_shaky_correct_not_enough_count_stays_shaky() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(
        KnowledgeStateEnum.SHAKY,
        StateEvent.CORRECT,
        correct_count=2,
        sessions_since_first_correct=2,
    )
    assert result == KnowledgeStateEnum.SHAKY


def test_shaky_correct_not_enough_sessions_stays_shaky() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(
        KnowledgeStateEnum.SHAKY,
        StateEvent.CORRECT,
        correct_count=3,
        sessions_since_first_correct=1,
    )
    assert result == KnowledgeStateEnum.SHAKY


def test_solid_retrievability_low_becomes_stale() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(KnowledgeStateEnum.SOLID, StateEvent.RETRIEVABILITY_LOW)
    assert result == KnowledgeStateEnum.STALE


def test_stale_correct_becomes_solid() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(KnowledgeStateEnum.STALE, StateEvent.CORRECT)
    assert result == KnowledgeStateEnum.SOLID


def test_unseen_wrong_stays_unseen() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(KnowledgeStateEnum.UNSEEN, StateEvent.WRONG)
    assert result == KnowledgeStateEnum.UNSEEN


def test_can_transition_valid() -> None:
    sm = KnowledgeStateMachine()
    assert sm.can_transition(KnowledgeStateEnum.UNSEEN, StateEvent.QUESTION_SHOWN) is True


def test_can_transition_invalid() -> None:
    sm = KnowledgeStateMachine()
    assert sm.can_transition(KnowledgeStateEnum.UNSEEN, StateEvent.WRONG) is False


def test_shaky_teach_back_passed_enough_becomes_solid() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(
        KnowledgeStateEnum.SHAKY,
        StateEvent.TEACH_BACK_PASSED,
        correct_count=3,
        sessions_since_first_correct=2,
    )
    assert result == KnowledgeStateEnum.SOLID


def test_stale_teach_back_passed_becomes_solid() -> None:
    sm = KnowledgeStateMachine()
    result = sm.transition(KnowledgeStateEnum.STALE, StateEvent.TEACH_BACK_PASSED)
    assert result == KnowledgeStateEnum.SOLID
