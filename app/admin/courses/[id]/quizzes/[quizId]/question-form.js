"use client";

import { useState } from "react";
import FileUpload from "@/app/admin/file-upload";
import { addQuestion } from "@/app/admin/quiz-actions";
import SubmitButton from "@/app/admin/submit-button";

const TYPES = [
  { value: "single", label: "Multiple choice" },
  { value: "multiple", label: "Select all that apply" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the blank" },
];
const LETTERS = "abcdef";

// Add one question. Inputs change with the question type.
export default function QuestionForm({ courseId, quizId, number }) {
  const [type, setType] = useState("single");
  const [optionCount, setOptionCount] = useState(4);
  const [withAudio, setWithAudio] = useState(false);
  const [uploading, setUploading] = useState(false);

  return (
    <form action={addQuestion} className="chapter-form question-form">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="quiz_id" value={quizId} />

      <div className="kind-toggle wrap" role="radiogroup" aria-label="Question type">
        {TYPES.map((t) => (
          <label key={t.value} className={type === t.value ? "active" : undefined}>
            <input type="radio" name="type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} />
            {t.label}
          </label>
        ))}
      </div>

      <label>
        Question {number}
        <textarea name="prompt" rows={2} required
          placeholder={type === "fill_blank" ? "e.g. She ___ to school every day. (go)" : "e.g. Which sentence is correct?"} />
      </label>

      {(type === "single" || type === "multiple") && (
        <fieldset className="options">
          <legend>Answers: tick the correct {type === "single" ? "one" : "ones"}</legend>
          {Array.from({ length: optionCount }, (_, i) => (
            <div key={i} className="option-row">
              {type === "single"
                ? <input type="radio" name="correct" value={LETTERS[i]} aria-label={`Option ${LETTERS[i]} is correct`} required />
                : <input type="checkbox" name="correct_multi" value={LETTERS[i]} aria-label={`Option ${LETTERS[i]} is correct`} />}
              <span className="option-letter">{LETTERS[i].toUpperCase()}</span>
              <input name={`option_${i}`} placeholder={i < 2 ? "Answer (required)" : "Answer (optional)"} required={i < 2} />
            </div>
          ))}
          {optionCount < LETTERS.length && (
            <button type="button" className="link-btn small" onClick={() => setOptionCount((n) => n + 1)}>+ Add another answer</button>
          )}
        </fieldset>
      )}

      {type === "true_false" && (
        <div className="kind-toggle">
          <label><input type="radio" name="correct_tf" value="true" defaultChecked /> ✓ True is correct</label>
          <label><input type="radio" name="correct_tf" value="false" /> ✕ False is correct</label>
        </div>
      )}

      {type === "fill_blank" && (
        <label>
          Correct answer
          <input name="accepted" placeholder="e.g. goes" required />
          <small className="hint">Capitals and extra spaces are ignored. Accept several answers by separating them with commas: goes, walks</small>
        </label>
      )}

      {withAudio ? (
        <div>
          <span className="field-label">Listening audio <span className="hint">(played with the question)</span></span>
          <FileUpload kind="audio" name="audio_path" folder={courseId} onBusyChange={setUploading} />
        </div>
      ) : (
        <button type="button" className="link-btn small" onClick={() => setWithAudio(true)}>🎧 Add listening audio to this question</button>
      )}

      <div className="form-row">
        <label className="grow">
          Explanation <span className="hint">(shown after submitting)</span>
          <input name="explanation" placeholder="e.g. We use 'goes' with he/she/it in the present simple." />
        </label>
        <label className="narrow">
          Points
          <input name="points" type="number" min="1" defaultValue="1" />
        </label>
      </div>

      <div>
        <SubmitButton disabled={uploading} pendingText="Adding question…">
          {uploading ? "Wait for the upload to finish…" : `Add question ${number}`}
        </SubmitButton>
      </div>
    </form>
  );
}
