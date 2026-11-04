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
  <p><strong>Systems Engineering Across Physical and Digital Infrastructure.</strong></p>

  <p>I explore how complex engineering systems are designed, modelled, integrated, and operated—from aerospace and rail infrastructure to industrial automation and manufacturing.</p>

  <p>This platform documents my work in systems engineering, simulation, operational reliability, and data-driven decision-making. Projects connect system-level architecture with physical constraints, measurable performance, and practical engineering trade-offs.</p>

  <ul>
    <li><strong>Focus:</strong> Aerospace & Defense · Rail & Transport Systems · Industrial Automation · Infrastructure Engineering · Digital Twins</li>
    <li><strong>Methodology:</strong> Systems-level analysis, operational modelling, simulation, reliability assessment, and evidence-based engineering trade-offs.</li>
    <li><strong>Interactive Lab:</strong> Executable simulations, operational decision-support tools, scheduling algorithms, and data-driven engineering models.</li>
  </ul>
</div>
