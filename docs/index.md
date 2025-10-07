<style>
/* Responsive hero */
.hero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin: 0 0 12px 0;
}
.hero__img {
  width: 540px;              /* desktop/tablet */
  max-width: 65vw;
  height: auto;
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0,0,0,0.4);
  display: block;
}
.hero__body { flex: 1 1 auto; }

/* Stack on phones */
@media (max-width: 680px) {
  .hero {
    flex-direction: column;
    align-items: center;
    text-align: left;       /* keep body text left-aligned */
  }
  .hero__img {
    width: 160px;           /* smaller avatar on mobile */
    max-width: 55vw;
  }
}
</style>

<div class="hero">
  <img src="/alvin-site/assets/yomori-512.png"
       alt="Alvin Li" class="hero__img" />
  <div class="hero__body">
    <p><strong>Precision across logistics, infrastructure, and industrial systems.</strong></p>
    <p>I share concise observations from industrial plants, laboratories, airports, rail hubs, and stadiums — places where scale and discipline define how things run.</p>
    <ul>
      <li><strong>Focus:</strong> Logistics · Rail Systems · Aerospace · Advanced Manufacturing · Energy Transition</li>
      <li><strong>Style:</strong> Clear, concise, and visually grounded</li>
      <li><strong>Why:</strong> Finding structure and discipline that elevates performance</li>
    </ul>
  </div>
</div>
