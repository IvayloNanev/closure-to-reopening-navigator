"use client";

import { useState } from "react";

export function IntakeForm() {
  const [reviewed, setReviewed] = useState(false);

  return (
    <form className="intake-form" onSubmit={(event) => { event.preventDefault(); if (event.currentTarget.reportValidity()) setReviewed(true); }}>
      <div className="field-grid">
        <label>Restaurant name<input name="restaurant" required autoComplete="organization" /></label>
        <label>Address or CAMIS number<input name="restaurant_identifier" required /></label>
        <label>Contact name<input name="contact" required autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <label>Phone<input name="phone" type="tel" required autoComplete="tel" /></label>
        <label>Closure date<input name="closure_date" type="date" required /></label>
      </div>
      <label>Inspection or closure document<span className="field-note">PDF, JPG, or PNG</span><input className="file-input" name="document" type="file" accept=".pdf,image/jpeg,image/png" /></label>
      <label>What is happening right now?<textarea name="situation" rows={5} required placeholder="Tell us what has been corrected, what is still unclear, and whether a reinspection has been scheduled." /></label>
      <label className="consent"><input name="consent" type="checkbox" required /> <span>I agree that Six Days may contact me about this reopening request.</span></label>
      <button className="submit-button" type="submit">Review my information <span aria-hidden="true">→</span></button>
      <p className="form-safety">Development preview: this form validates locally but does not transmit or store your information yet.</p>
      {reviewed && <div className="form-result" role="status"><strong>Your information is complete.</strong><span>Submission is disabled in this preview, so nothing was sent or stored.</span></div>}
    </form>
  );
}
