<script lang="ts">
  import Seo from "$lib/components/Seo.svelte";
  import Workplace from "./Workplace.svelte";
</script>

<Seo
  title="Austin Li – Resume"
  description="Software engineer, amateur physicist, and photographer. Building technology for social good."
/>

<section class="layout-md py-12">
  <h2 class="heading2">Education</h2>

  <div class="mb-4">
    <div class="flex justify-between items-end">
      <h3 class="text-black text-lg">Harvard College</h3>
      <div class="text-neutral-500 mb-0.5">2019 — 2023</div>
    </div>
    <p class="byline">A.B. in Physics and Computer Science</p>
  </div>

  <p>Graduated with high honors in field.</p>

  <h4 class="font-medium mt-4 mb-1">Teaching:</h4>
  <ul>
    <li>TF for Physics 153 (Electrodynamics), Spring 2023</li>
    <li>
      TF for Physics 15a (Introductory Mechanics and Relativity), Fall 2022
    </li>
    <li>
      TF for CS 20 (Discrete Mathematics for Computer Science), Spring 2022
    </li>
    <li>
      CA for Math 22a (Vector Calculus and Linear Algebra I), Fall 2020, 2021
    </li>
    <li>
      CA for Math 22b (Vector Calculus and Linear Algebra II), Spring 2021
    </li>
    <li>
      TA for <a class="link" href="https://mathematics.uchicago.edu/young-scholars-program/">Young Scholars Program</a>, Summer 2019
    </li>
  </ul>

  <h4 class="font-medium mt-4 mb-1">Graduate-level technical coursework:</h4>
  <ul>
    <li>Optimized Democracy (CS 238)</li>
    <li>Theory of Computation (MIT 6.840)</li>
    <li>Quantum Computation (MIT 8.370)</li>
  </ul>

  <h4 class="font-medium mt-4 mb-1">Undergraduate technical coursework:</h4>
  <ul>
    <li>Data Structures and Algorithms (CS 124)</li>
    <li>Machine Learning (CS 181)</li>
    <li>Economics and Computation (CS 136)</li>
    <li>Quantum Mechanics I (Physics 143a)</li>
    <li>Quantum Mechanics II (Physics 143b)</li>
    <li>Electrodynamics (Physics 153)</li>
    <li>Statistical Mechanics and Thermodynamics (Physics 181)</li>
    <li>Advanced Laboratory (Physics 191)</li>
    <li>Mechanics and Special Relativity (Physics 16)</li>
    <li>Algebra I (Math 122)</li>
    <li>Theoretical Linear Algebra and Real Analysis I (Math 25a)</li>
    <li>Theoretical Linear Algebra and Real Analysis II (Math 25b)</li>
  </ul>
</section>

<section class="layout-md py-12">
  <h2 class="heading2">Professional Experience</h2>

  <Workplace
    title="Founding Engineer"
    company="Koi Platforms"
    url="https://usekoi.com/"
    dates="April 2025 – Current"
    location="New York, NY"
  >
    <li>First hired engineer at a seed-stage startup.</li>
  </Workplace>

  <Workplace
    title="Software Engineer"
    company="Capital One"
    url="https://www.capitalone.com/"
    dates="August 2023 - April 2025"
    location="New York, NY"
  >
    <li>
      Led experience modernization and design modernization across entire iOS
      digital fraud and disputes team in Swift.
    </li>
    <li>
      Built smart document upload orchestration layer and API for digital fraud
      and disputes using Java, and AWS.
    </li>
  </Workplace>

  <Workplace
    title="Data Science Intern"
    company="Zest AI"
    url="https://www.zest.ai/"
    dates="June 2021 - August 2021"
    location="Los Angeles, CA"
  >
    <li>
      Designed, trained, and deployed a geography‐agnostic race prediction model
      used to measure disparate impact of fair lending tools for clients in
      PyTorch, available open‐source; method used by Census in October 2022.
    </li>
    <li>
      Developed geocoding method using public Census shapefile data, achieving
      90% data retention and 99% accuracy, and reducing query times from hours
      to minutes.
    </li>
  </Workplace>

  <Workplace
    title="Director of Growth"
    company="Wave Learning Festival"
    url="https://www.wavelf.org/"
    dates="August 2020 - January 2021"
    location="Chicago, IL"
    defaultHidden
  >
    <li>
      Founding Director of Growth, leading 100+ volunteers across strategy,
      partnerships, and media to reach underserved youth.
    </li>
    <li>
      Developed data‐driven outreach strategies, expanding organizational
      presence in 20+ cities across the United States and abroad, providing 100+
      hours of tutoring to 13k+ students by departure from organization.
    </li>
    <li>
      Coordinated partnerships with 600+ schools, libraries, and 40+ community
      organizations serving low‐income and homeless youth across the United
      States.
    </li>
  </Workplace>

  <Workplace
    title="Undergraduate Research Fellow"
    company="Harvard Department of Physics"
    url="https://www.physics.harvard.edu/"
    dates="June 2020 - September 2020"
    location="Chicago, IL"
    defaultHidden
  >
    <li>
      Developed optimization algorithm for wire tension measurement device in
      Python, reducing runtime from minutes to seconds and reducing the error to
      within 1% of ground truth.
    </li>
    <li>
      Researcher in the Deep Underground Neutrino Experiment (<a
        class="link"
        href="https://www.dunescience.org/">DUNE</a
      >) collaboration, fortunate to be mentored by
      <a
        class="link"
        href="https://www.dunescience.org/facesofdune/roxanne-guenette/"
        >Professor Roxanne Guenette</a
      >
      and
      <a
        class="link"
        href="https://www.dunescience.org/facesofdune/sebastien-prince/"
        >Dr. Sebastien Prince</a
      >.
    </li>
  </Workplace>
</section>

<style lang="postcss">
  b {
    @apply font-medium;
  }

  ul {
    @apply list-disc pl-7 marker:text-neutral-400;
  }

  .byline {
    @apply font-serif italic;
  }
</style>
