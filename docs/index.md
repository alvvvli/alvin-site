<style>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 0 0 24px 0;
  text-align: center;
}

.hero__imgbox {
  text-align: center;
}

.hero__img {
  width: 300px;
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0,0,0,0.4);
  display: block;
  margin: 0 auto; /* ensures center alignment */
}

.hero__caption {
  font-size: 0.8rem;
  color: #9fb4d1;
  margin-top: 6px;
  text-align: center;
}

.hero__body {
  max-width: 700px;
  text-align: left;
}

.hero__body ul {
  padding-left: 20px;
  list-style-position: outside;
}

@media (max-width: 768px) {
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
  <div class="hero__imgbox">
    <img src="/alvin-site/assets/yomori-512.png" alt="Kou Yamori — Call of the Night S2 E1" class="hero__img" />
    <p class="hero__caption">
      Source: <a href="https://yofukashi-no-uta.com/" target="_blank" rel="noopener">「よふかしのうた」製作委員会</a>
    </p>
  </div>
<div class="hero__body">
  <p><strong>Architecting precision across global infrastructure and industrial systems.</strong></p>

  <p>I design, simulate, and document the structural frameworks that move macro industries—from automated aerospace kitting networks to high-performance heavy logistics. This platform serves as a living, code-driven laboratory where systems engineering, data modeling, and physical operations intersect.</p>

  <ul>
    <li><strong>Focus:</strong> Aerospace · Rail Systems · Advanced Manufacturing · Digital Twins · Supply Chain Dynamics</li>
    <li><strong>Methodology:</strong> High-velocity, AI-augmented architecture backed by rigorous, version-controlled execution.</li>
    <li><strong>Interactive Lab:</strong> Direct deployment of live, functional simulations, scheduling engines, and relational data tools.</li>
  </ul>
</div>
