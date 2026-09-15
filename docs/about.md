<style>

.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 20px;
}

.hero-images {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 270px;
  flex-shrink: 0;
}

.hero-images img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0,0,0,0.4);
}

.hero-text {
  flex: 1;
  min-width: 240px;
}

/* Your badge CSS etc. */

/* Mobile */
@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .hero-images {
    width: 60%;
    max-width: 320px;
  }

  .hero-images img {
    width: 100%;
  }

  .hero-text {
    text-align: center;
    width: 100%;
  }

  .badge-cluster {
    justify-content: center;
  }
}

</style>

<div class="hero">

<div class="hero-images">
<img src="/alvin-site/JPG_VID/ila2026.jpeg" alt="ILA Berlin">
<img src="/alvin-site/JPG_VID/a380.jpeg" alt="Airbus A380">
</div>

<div class="hero-text">

<p><strong>I'm Alvin.</strong></p>

<p>I architect data, logistics, and simulation systems that move global industries.</p>

<p>My work bridges the gap between macro aerospace/rail infrastructure and micro-level technical execution. I specialize in digital twins, supply chain network optimization, and automated data workflows—built with the discipline of continuous, version-controlled iteration.</p>

<p>Building reliable systems where engineering, operations, and infrastructure meet. Explore my live systems frameworks and operational models in the Interactive Lab.</p>

<div class="badge-cluster">
<span>GE Vernova</span>
<span>FAA AT-SA</span>
<span>InnoTrans</span>
<span>ILA Berlin</span>
<span>Singapore Airshow</span>
<span>UC Berkeley</span>
<span>National University of Singapore</span>
<span>Wageningen University & Research</span>
<span>University of Copenhagen</span>
<span>Digital Twins</span>
<span>Siemens Tecnomatix</span>
<span>Python & SQL</span>
<span>ISO 9001 QMS</span>
</div>

<div class="hero-contact">
<a href="mailto:alkanmuri17@gmail.com">alkanmuri17@gmail.com</a>
</div>

</div>
</div>
