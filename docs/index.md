<style>
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 20px;
  margin: 0 0 24px 0;
}

.hero__img {
  width: 400px;              /* desktop/tablet */
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0,0,0,0.4);
}

.hero__body {
  flex: 1 1 auto;
  text-align: left;          /* ensure left alignment for text & bullets */
}

.hero__body ul {
  padding-left: 20px;        /* indent bullets nicely */
  list-style-position: outside;
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .hero__img {
    width: 60%;              /* smaller avatar on mobile */
    max-width: 320px;
  }

  .hero__body {
    text-align: left;        /* override centering for bullet points */
    width: 90%;
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
