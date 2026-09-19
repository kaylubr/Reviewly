# Reviewly

A study app where a user turns their own notes or documents into modules of questions and reviews them to build recall.

## Language

**Module**:
A study unit a user creates from pasted notes or an uploaded document, and which owns every question reviewed in it.
_Avoid_: Deck, course, subject, topic

**Flashcard**:
A question and answer pair belonging to a module.
_Avoid_: Card, note, prompt

**MCQ question**:
A multiple-choice question belonging to a module, with four options, exactly one of them correct, and an explanation of the answer.
_Avoid_: Quiz question, multiple choice

**Mastery score**:
How well the user knows a module, revised after each review session of it.
_Avoid_: Score, proficiency, grade

**Review session**:
One pass through a module's questions in a single review mode, recording the score, the number of correct answers, and the duration.
_Avoid_: Quiz, test, attempt, run

**Review mode**:
One of the three ways a review session is run — `flashcard`, `mcq`, or `speed` — each presenting the module's questions differently.
_Avoid_: Game mode, exercise type

**Auth session**:
A user's authenticated login, stored in PostgreSQL and referenced by a cookie. Distinct from a review session, which is why bare "session" never means this.
_Avoid_: Session, login, token
