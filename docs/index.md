<style>
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 20px;
  margin: 0 0 24px 0;
}

.hero__img {
  width: 300px;
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0,0,0,0.4);
  display: block;
}

.hero__caption {
  font-size: 0.8rem;
  color: #9fb4d1;
  margin-top: 6px;
  text-align: center;
}

.hero__body {
  flex: 1 1 auto;
  text-align: left;
}

.hero__body ul {
  padding-left: 20px;
  list-style-position: outside;
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .hero__img {
    width: 60%;
    max-width: 320px;
  }

  .hero__body {
    text-align: left;
    width: 90%;
  }
}
</style>

<div class="hero">
  <div>
    <img src="/alvin-site/assets/yomori-512.png" alt="Kou Yamori — Call of the Night S2 E1" class="hero__img" />
    <p class="hero__caption">Source: Kotoyama: Kou Yamori ("Call of the Night" S2 E1)</p>
  </div>
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
