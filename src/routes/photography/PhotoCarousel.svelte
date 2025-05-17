<script lang="ts">
  // Types
  type Photo = {
    title: string;
    date: Date;
    description: string;
    secondDescription?: string;
    crop?: string;
    link: string;
  };

  // Props
  export let data: Photo[];
  
  // State
  let currentIndex = 0;
  
  // Methods
  function nextPhoto() {
    currentIndex = (currentIndex + 1) % data.length;
  }
  
  function previousPhoto() {
    currentIndex = (currentIndex - 1 + data.length) % data.length;
  }
  
  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
    });
  }
</script>

<div class="relative">
  <div class="max-w-[1152px] mx-auto relative">
    <!-- Photo Container -->
    <div class="aspect-[4/3] relative">
      <img
        src={data[currentIndex].link}
        alt={data[currentIndex].title}
        class="w-full h-full object-contain"
      />
      
      <!-- Navigation Controls -->
      <div class="flex items-start justify-between">
        <button
          class="text-neutral-500 hover:text-black transition-colors"
          on:click={previousPhoto}
          aria-label="Previous photo"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-8 w-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="1.5" 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </button>

        <div class="flex-1 mx-8">
          <div class="flex justify-between items-start">
            <div class="space-y-2">
              <p class="text-lg">{data[currentIndex].description}</p>
              {#if data[currentIndex].secondDescription}
                <p class="text-lg font-serif italic">
                  {data[currentIndex].secondDescription}
                </p>
              {/if}
            </div>
            <p class="text-neutral-500">
              {formatDate(data[currentIndex].date)}
            </p>
          </div>
        </div>

        <button
          class="text-neutral-500 hover:text-black transition-colors"
          on:click={nextPhoto}
          aria-label="Next photo"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-8 w-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="1.5" 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Photo Information -->
    <!-- <div class="text-center text-neutral-500">
      {currentIndex + 1} / {data.length}
    </div> -->
  </div>
</div> 