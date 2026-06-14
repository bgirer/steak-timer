/**
 * Seared - Steak Cooking Planner & Timer
 * Core application controller, cooking algorithm, and audio synthesis engine.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- APPLICATION STATE ---
  const state = {
    cut: "ribeye",
    thickness: 1.25,
    temp: "fridge",
    surface: "cast-iron",
    method: "oven-finish", // Selected or recommended method
    doneness: "med-rare",
    targetTemp: "130°F - 135°F",
    stages: [],
    currentStageIndex: 0,
    timerSecondsLeft: 0,
    timerTotalDuration: 0,
    timerIntervalId: null,
    isTimerRunning: false,
    isMuted: false,
    audioContext: null,
    hasUserSelectedMethodManually: false,
    isCookComplete: false
  };

  // --- CUT DETAILS & CHEF TIPS ---
  const cutDetails = {
    ribeye: {
      name: "Ribeye",
      tips: [
        "Ribeye contains heavy fat marbling. Cast iron or a hot grill is ideal to render it properly.",
        "Make sure to sear the thick fat cap on the side of the steak for at least 30 seconds.",
        "Letting a ribeye rest allows the rendered fat to redistribute into the meat fibres."
      ]
    },
    "ny-strip": {
      name: "New York Strip",
      tips: [
        "NY Strip has a thick band of fat along one side. Sear this fat edge first to render it down.",
        "Brushing with butter and herbs in the final minute enhances the beefy strip flavor.",
        "For even cooking, flip frequently if grilling directly over charcoal."
      ]
    },
    "filet-mignon": {
      name: "Filet Mignon",
      tips: [
        "Filet Mignon is extremely lean. Be careful not to overcook it; rare to medium-rare is best.",
        "Since it has little fat, basting with butter, garlic, and thyme is highly recommended.",
        "Because of its height (often 2\"+), cooking in the oven (reverse sear or oven finish) is critical."
      ]
    },
    sirloin: {
      name: "Sirloin",
      tips: [
        "Sirloin is lean and can become tough if cooked past medium. Cook to medium-rare for best results.",
        "Marinating beforehand can tenderize the meat, but pat it completely dry before searing.",
        "Baste generously with butter to add rich moisture to this leaner cut."
      ]
    },
    "flank-skirt": {
      name: "Flank / Skirt",
      tips: [
        "These are thin, flat cuts. Cook them hot and fast over direct heat; never use low-temp baking.",
        "Always slice flank or skirt steak thinly against the grain (at a 45-degree angle) for tenderness.",
        "Excellent candidates for direct grilling or a screaming hot stainless steel pan."
      ]
    }
  };

  // --- UI ELEMENT SELECTORS ---
  const selectors = {
    configSection: document.getElementById("config-section"),
    planSection: document.getElementById("plan-section"),
    timerSection: document.getElementById("timer-section"),

    thicknessInput: document.getElementById("thickness"),
    thicknessDisplay: document.getElementById("thickness-display"),

    safetyWarning: document.getElementById("safety-warning"),
    warningMessage: document.getElementById("warning-message"),

    calculateBtn: document.getElementById("calculate-btn"),

    backToConfigBtn: document.getElementById("back-to-config"),

    recommendationTitle: document.getElementById("recommendation-title"),
    recommendationDesc: document.getElementById("recommendation-desc"),
    totalTimeVal: document.getElementById("total-time-val"),
    targetTempVal: document.getElementById("target-temp-val"),
    timelineList: document.getElementById("timeline-list"),
    chefTipsList: document.getElementById("chef-tips-list"),

    startTimerBtn: document.getElementById("start-timer-btn"),

    timerClock: document.getElementById("timer-clock"),
    timerStageTitle: document.getElementById("timer-stage-title"),
    timerStageIndicator: document.getElementById("timer-stage-indicator"),
    stageDescTitle: document.getElementById("stage-desc-title"),
    stageDescText: document.getElementById("stage-desc-text"),
    progressBarSteps: document.getElementById("progress-bar-steps"),

    playPauseBtn: document.getElementById("play-pause-btn"),
    playPauseIcon: document.getElementById("play-pause-icon"),
    skipStageBtn: document.getElementById("skip-stage-btn"),
    resetTimerBtn: document.getElementById("reset-timer-btn"),
    soundToggleBtn: document.getElementById("sound-toggle-btn"),
    soundIcon: document.getElementById("sound-icon"),

    circleProgress: document.querySelector(".progress-ring__circle"),

    // Modal & Exit elements
    planModal: document.getElementById("plan-modal"),
    viewPlanBtn: document.getElementById("view-plan-btn"),
    closeModalBtn: document.getElementById("close-modal-btn"),
    modalCloseActionBtn: document.getElementById("modal-close-action-btn"),
    exitTimerBtn: document.getElementById("exit-timer-btn"),

    modalRecommendationTitle: document.getElementById("modal-recommendation-title"),
    modalRecommendationDesc: document.getElementById("modal-recommendation-desc"),
    modalTotalTimeVal: document.getElementById("modal-total-time-val"),
    modalTargetTempVal: document.getElementById("modal-target-temp-val"),
    modalTimelineList: document.getElementById("modal-timeline-list"),
    modalChefTipsList: document.getElementById("modal-chef-tips-list")
  };

  // Setup Progress Ring
  const radius = selectors.circleProgress.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  selectors.circleProgress.style.strokeDasharray = `${circumference} ${circumference}`;
  selectors.circleProgress.style.strokeDashoffset = circumference;

  // --- AUDIO SYNTHESIS ENGINE ---
  function initAudio() {
    if (!state.audioContext) {
      try {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn("AudioContext not supported by browser", e);
      }
    }
  }

  function playSound(freq, duration, type = "sine") {
    if (state.isMuted) return;
    initAudio();
    if (!state.audioContext) return;
    try {
      if (state.audioContext.state === "suspended") {
        state.audioContext.resume();
      }

      const osc = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();

      osc.connect(gain);
      gain.connect(state.audioContext.destination);

      osc.type = type;
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, state.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, state.audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, state.audioContext.currentTime + duration);

      osc.start(state.audioContext.currentTime);
      osc.stop(state.audioContext.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  function alertStageWarning() {
    // 3 short warning beeps
    playSound(880, 0.1);
    setTimeout(() => playSound(880, 0.1), 150);
    setTimeout(() => playSound(880, 0.1), 300);
  }

  function alertStageChange() {
    // Long high beep
    playSound(1200, 0.5);
  }

  function alertCookComplete() {
    // Ascending celebratory arpeggio
    playSound(523.25, 0.15); // C5
    setTimeout(() => playSound(659.25, 0.15), 150); // E5
    setTimeout(() => playSound(783.99, 0.15), 300); // G5
    setTimeout(() => playSound(1046.50, 0.4), 450); // C6
  }

  // --- EVENT LISTENERS FOR SELECTION CARDS ---
  function setupSelectionCard(selectorClass, stateProperty, callback) {
    const cards = document.querySelectorAll(selectorClass);
    cards.forEach(card => {
      card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");

        // Extract attribute value
        const value = card.dataset[stateProperty];
        state[stateProperty] = value;

        if (callback) callback(value);
        validateInputs();
      });
    });
  }

  // Smart Method Selection Helper
  function getRecommendedMethod() {
    if (state.cut === "flank-skirt") {
      return "pan-sear";
    }
    if (state.temp === "frozen") {
      return "oven-finish";
    }
    if (state.thickness < 1.25) {
      return "pan-sear";
    }
    if (state.thickness >= 1.25 && state.thickness < 1.5) {
      return "oven-finish";
    }
    return "reverse-sear";
  }

  function updateMethodRecommendation() {
    const recommendedMethod = getRecommendedMethod();
    const methodCards = document.querySelectorAll("[data-method]");

    methodCards.forEach(card => {
      const methodVal = card.dataset.method;

      // Remove any existing recommended badge
      const badge = card.querySelector(".recommended-badge");
      if (badge) badge.remove();

      if (methodVal === recommendedMethod) {
        const span = document.createElement("span");
        span.className = "recommended-badge";
        span.innerText = "Recommended";
        card.appendChild(span);
      }
    });

    if (!state.hasUserSelectedMethodManually) {
      state.method = recommendedMethod;
      methodCards.forEach(card => {
        if (card.dataset.method === recommendedMethod) {
          card.classList.add("active");
        } else {
          card.classList.remove("active");
        }
      });
    }
  }

  setupSelectionCard("[data-cut]", "cut", (val) => {
    // Adjust thickness boundaries based on cut
    if (val === "flank-skirt") {
      selectors.thicknessInput.value = 0.5;
      selectors.thicknessInput.max = 1.0;
      updateThicknessDisplay(0.5);
    } else {
      selectors.thicknessInput.max = 3.0;
      // Restore default thickness if it was previously set to thin cut bounds
      if (parseFloat(selectors.thicknessInput.value) <= 1.0) {
        selectors.thicknessInput.value = 1.25;
        updateThicknessDisplay(1.25);
      }
    }
    state.thickness = parseFloat(selectors.thicknessInput.value);
    updateMethodRecommendation();
  });

  setupSelectionCard("[data-temp]", "temp", () => {
    updateMethodRecommendation();
  });
  setupSelectionCard("[data-surface]", "surface");
  setupSelectionCard("[data-doneness]", "doneness");
  setupSelectionCard("[data-method]", "method", (val) => {
    state.hasUserSelectedMethodManually = true;
  });

  // Thickness Slider
  selectors.thicknessInput.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    state.thickness = val;
    updateThicknessDisplay(val);
    updateMethodRecommendation();
    validateInputs();
  });

  function updateThicknessDisplay(val) {
    const cm = (val * 2.54).toFixed(1);
    selectors.thicknessDisplay.innerHTML = `${val.toFixed(2)}" <span class="unit">(${cm} cm)</span>`;
  }

  // --- INPUT VALIDATION & SAFETY WARNINGS ---
  function validateInputs() {
    let warnings = [];

    // 1. Frozen steak warnings
    if (state.temp === "frozen") {
      if (state.cut === "flank-skirt") {
        warnings.push("Cooking thin frozen cuts like flank/skirt directly is not advised. Thaw completely in cold water first.");
      } else {
        if (state.method === "sous-vide") {
          warnings.push("Sous-vide is perfect for frozen steak! The algorithm will extend the bath duration by 50% to safely defrost and cook in one step.");
        } else if (state.method === "reverse-sear") {
          warnings.push("Reverse searing a frozen steak directly is not recommended because low oven bake (225°F) takes too long to cross the danger zone from frozen. We recommend using Oven Finish (starts with high pan sear) or Sous-Vide.");
        } else if (state.method === "pan-sear") {
          warnings.push("Traditional pan searing a frozen steak is highly discouraged. The exterior will char black before the center thaws. Please defrost first, or select Oven Finish / Sous-Vide.");
        }
      }
    }

    // 2. Thickness & Method mismatches
    if (state.thickness >= 1.5 && state.method === "pan-sear" && state.temp !== "frozen") {
      warnings.push(`A ${state.thickness}" steak is too thick for a traditional pan sear. The exterior will burn before the interior reaches doneness. We highly suggest selecting <strong>Reverse Sear</strong> or <strong>Oven Finish</strong>.`);
    }

    if (state.thickness <= 0.75 && (state.method === "reverse-sear" || state.method === "oven-finish")) {
      warnings.push(`A thin ${state.thickness}" steak cooks extremely fast. Baking methods like ${state.method === "reverse-sear" ? "Reverse Sear" : "Oven Finish"} will likely overcook it. <strong>Traditional Sear</strong> is highly recommended.`);
    }

    // 3. Non-stick Pan warnings
    if (state.surface === "nonstick") {
      if (state.method === "sous-vide") {
        warnings.push("Searing a sous-vide steak on non-stick is possible, but not recommended. Searing requires extremely high heat, which can degrade non-stick coatings and release fumes. Cast Iron, Stainless Steel, or a Grill are superior.");
      } else {
        warnings.push("Cooking steaks on non-stick pans is not recommended because the high searing heat can destroy the coating. A longer cooking time is calculated to accommodate a safer medium-high heat limit.");
      }
    }

    // Toggle warning display
    if (warnings.length > 0) {
      selectors.warningMessage.innerHTML = warnings.map(w => `<div>• ${w}</div>`).join("");
      selectors.safetyWarning.classList.remove("hidden");
    } else {
      selectors.safetyWarning.classList.add("hidden");
    }
  }

  // --- THE PERFECT STEAK ALGORITHM ---
  function calculateCookingPlan() {
    const cut = state.cut;
    const thickness = state.thickness;
    const temp = state.temp;
    const surface = state.surface;
    const doneness = state.doneness;
    const method = state.method;

    let targetTemp = "";
    let donenessName = "";

    // Set Target Temperature Label based on Doneness
    switch (doneness) {
      case "rare":
        targetTemp = "120°F - 125°F (49°C - 52°C)";
        donenessName = "Rare";
        break;
      case "med-rare":
        targetTemp = "130°F - 135°F (54°C - 57°C)";
        donenessName = "Medium Rare";
        break;
      case "medium":
        targetTemp = "140°F - 145°F (60°C - 63°C)";
        donenessName = "Medium";
        break;
      case "med-well":
        targetTemp = "145°F - 150°F (63°C - 66°C)";
        donenessName = "Medium Well";
        break;
      case "well":
        targetTemp = "160°F+ (71°C+)";
        donenessName = "Well Done";
        break;
    }

    state.targetTemp = targetTemp;

    // STAGES ARRAY GENERATION
    let stages = [];
    let chefTips = [...cutDetails[cut].tips];

    // Math calculation parameters
    let baseSearTime = 240; // 4 mins in seconds
    if (cut === "flank-skirt") baseSearTime = 180; // 3 mins in seconds

    // Doneness Adjustments (seconds)
    let donenessSeconds = 0;
    if (doneness === "rare") donenessSeconds = -60;
    if (doneness === "medium") donenessSeconds = 60;
    if (doneness === "med-well") donenessSeconds = 120;
    if (doneness === "well") donenessSeconds = 240;

    // Thickness Adjustments (seconds)
    let thicknessSeconds = (thickness - 1.0) * 240; // 4 minutes per inch

    // Starting Temp Adjustments (seconds)
    let startTempSeconds = 0;
    if (temp === "fridge") startTempSeconds = 45;
    if (temp === "frozen") startTempSeconds = 180;

    // Cooking Surface Modifiers
    let surfaceMultiplier = 1.0;
    if (surface === "stainless") surfaceMultiplier = 1.1;
    if (surface === "grill") surfaceMultiplier = 1.15;
    if (surface === "nonstick") surfaceMultiplier = 1.25;

    if (method === "pan-sear") {
      // Direct Pan Sear or Grill
      let totalSear = Math.max(120, Math.round((baseSearTime + donenessSeconds + thicknessSeconds + startTempSeconds) * surfaceMultiplier));

      let sear1 = Math.round(totalSear * 0.45);
      let sear2 = Math.round(totalSear * 0.35);
      let baste = Math.round(totalSear * 0.20);
      let rest = Math.round(300 + (thickness - 1.0) * 120); // 5-8 mins rest

      stages.push({
        title: "Sear Side 1",
        duration: sear1,
        desc: `Place the steak in a hot ${getSurfaceName(surface)}. Sear without moving it. Adjust heat if smoking excessively.`
      });
      stages.push({
        title: "Sear Side 2",
        duration: sear2,
        desc: "Flip the steak over. Maintain heat to build a rich crust on the second side."
      });

      if (surface === "grill") {
        stages.push({
          title: "Final Direct Sear",
          duration: baste,
          desc: "Basting isn't advised on a grill. Instead, move the steak to a slightly cooler area of the grill to finish heating through evenly."
        });
      } else if (surface === "nonstick") {
        stages.push({
          title: "Finish & Baste",
          duration: baste,
          desc: "Add butter and herbs if desired. Searing on non-stick is slower, so keep heat to medium-high to protect your pan."
        });
      } else {
        stages.push({
          title: "Butter Basting",
          duration: baste,
          desc: "Toss in butter, crushed garlic, and herbs. Tilt the pan and continuously spoon the foaming butter over the top of the steak."
        });
        chefTips.push("During basting, spooning the hot butter cooks the steak gently and imparts an amazing nutty flavor.");
      }

      stages.push({
        title: "Resting",
        duration: rest,
        desc: "Remove from pan to a warm plate. Do NOT cover tightly. Resting allows meat fibers to relax and juices to redistribute."
      });

    } else if (method === "oven-finish") {
      // Pan Sear first, then finish in Oven
      let sear1 = Math.round(60 * surfaceMultiplier);
      let sear2 = Math.round(60 * surfaceMultiplier);

      // Calculate Oven Bake Time
      let baseOvenTime = 300; // 5 mins
      let thicknessOven = (thickness - 1.25) * 480; // 8 mins per inch
      let tempOven = 0;
      if (temp === "fridge") tempOven = 90;
      if (temp === "frozen") tempOven = 480; // defrost bake time

      let donenessOven = 0;
      if (doneness === "rare") donenessOven = -90;
      if (doneness === "medium") donenessOven = 90;
      if (doneness === "med-well") donenessOven = 180;
      if (doneness === "well") donenessOven = 300;

      let ovenDuration = Math.max(120, Math.round(baseOvenTime + thicknessOven + tempOven + donenessOven));
      let rest = 360; // 6 mins rest

      let ovenTemp = (temp === "frozen") ? "350°F (175°C)" : "400°F (200°C)";

      stages.push({
        title: "Sear Side 1",
        duration: sear1,
        desc: `Place the steak in a very hot oven-safe ${getSurfaceName(surface)}. Sear to color the crust.`
      });
      stages.push({
        title: "Sear Side 2",
        duration: sear2,
        desc: "Flip the steak. Cook briefly, then prepare to move the entire pan into the preheated oven."
      });
      stages.push({
        title: `Oven Finish (${ovenTemp})`,
        duration: ovenDuration,
        desc: `Place the oven-safe pan directly into the oven. Bake until you are 5°F below target internal temperature.`
      });
      stages.push({
        title: "Resting",
        duration: rest,
        desc: "Place the steak on a cutting board or rack. Let it rest while carryover heat finishes the cook."
      });

      chefTips.push(`Preheat your oven to ${ovenTemp} before starting. Ensure your skillet is oven-safe (like cast iron or steel, no plastic handles!).`);

    } else if (method === "reverse-sear") {
      // Bake low and slow first, then sear hot
      let baseOvenTime = 2100; // 35 mins
      let thicknessOven = (thickness - 1.5) * 1200; // 20 mins per inch
      let tempOven = (temp === "fridge") ? 300 : 0;

      let donenessOven = 0;
      if (doneness === "rare") donenessOven = -420;
      if (doneness === "medium") donenessOven = 480;
      if (doneness === "med-well") donenessOven = 900;
      if (doneness === "well") donenessOven = 1500;

      let ovenDuration = Math.max(900, Math.round(baseOvenTime + thicknessOven + tempOven + donenessOven));
      let ovenTemp = "225°F (107°C)";

      let coolRest = 120; // 2 min air cool rest before sear
      let sear1 = Math.round(60 * surfaceMultiplier);
      let sear2 = Math.round(60 * surfaceMultiplier);
      let finalRest = 180; // 3 min final rest (carryover is minimal in reverse sear)

      stages.push({
        title: `Low-Temp Bake (${ovenTemp})`,
        duration: ovenDuration,
        desc: `Place the steak on a wire rack on a baking sheet. Bake slowly at 225°F until the center reads about 10-15°F below your final target temperature.`
      });
      stages.push({
        title: "Pre-Sear Rest",
        duration: coolRest,
        desc: "Remove steak from the oven and pat it dry with paper towels. Let the surface cool down for a better sear."
      });
      stages.push({
        title: "Sear Side 1",
        duration: sear1,
        desc: `Sear in a hot ${getSurfaceName(surface)} with oil. We want a fast, heavy crust.`
      });
      stages.push({
        title: "Sear Side 2 & Baste",
        duration: sear2,
        desc: "Flip the steak. Add a large pat of butter and herbs to baste for the final minute."
      });
      stages.push({
        title: "Final Rest",
        duration: finalRest,
        desc: "Rest for a short 3 minutes. Carryover cooking is minimal, and the meat is ready to slice."
      });

      chefTips.push("Reverse sear yields the most even cooking with zero grey band. Patting the steak bone-dry after the oven is key to an instant crust.");

    } else if (method === "sous-vide") {
      // Precision water bath, then sear
      let baseBathTime = 3600; // 1 hour in seconds
      let thicknessBath = (thickness - 1.0) * 1800; // 30 mins per half inch
      if (temp === "frozen") baseBathTime *= 1.5; // 50% longer for frozen

      let bathDuration = Math.round(baseBathTime + thicknessBath);

      let sear1 = Math.round(45 * surfaceMultiplier);
      let sear2 = Math.round(45 * surfaceMultiplier);
      let rest = 120; // 2 mins rest

      // Get target temperature based on doneness
      let bathTemp = "130°F (54.4°C)";
      if (doneness === "rare") bathTemp = "120°F (49°C)";
      if (doneness === "medium") bathTemp = "140°F (60°C)";
      if (doneness === "med-well") bathTemp = "148°F (64.4°C)";
      if (doneness === "well") bathTemp = "160°F (71.1°C)";

      stages.push({
        title: `Sous-Vide Bath (${bathTemp})`,
        duration: bathDuration,
        desc: `Seal the seasoned steak in a bag and submerge it in the water bath at ${bathTemp}. Ensure the steak is fully submerged.`
      });
      stages.push({
        title: "Sear Side 1",
        duration: sear1,
        desc: `Remove steak from bag, pat it completely dry, and brush with oil. Sear in a screaming-hot ${getSurfaceName(surface)} for ${sear1} seconds.`
      });
      stages.push({
        title: "Sear Side 2",
        duration: sear2,
        desc: `Flip and sear the other side for ${sear2} seconds to finalize the color without cooking the interior.`
      });
      stages.push({
        title: "Resting",
        duration: rest,
        desc: "Rest for 2 minutes to let the surface cool down, then slice and serve. Carryover cooking is non-existent."
      });

      chefTips.push("Sous-vide guarantees perfection. Ensure the steak is extremely dry when it leaves the water bag; moisture is the enemy of a sear.");
    }

    state.stages = stages;
    state.currentStageIndex = 0;

    // Update Recommendations UI & Modal UI
    const methodNameText = getMethodName(method);
    const methodDescText = getMethodDesc(method, thickness, donenessName);
    const totalSeconds = stages.reduce((acc, stage) => acc + stage.duration, 0);
    const totalTimeText = formatTotalTime(totalSeconds);

    selectors.recommendationTitle.innerText = methodNameText;
    selectors.recommendationDesc.innerText = methodDescText;
    selectors.totalTimeVal.innerText = totalTimeText;
    selectors.targetTempVal.innerText = targetTemp;

    selectors.modalRecommendationTitle.innerText = methodNameText;
    selectors.modalRecommendationDesc.innerText = methodDescText;
    selectors.modalTotalTimeVal.innerText = totalTimeText;
    selectors.modalTargetTempVal.innerText = targetTemp;

    // Render Timeline Lists
    selectors.timelineList.innerHTML = "";
    selectors.modalTimelineList.innerHTML = "";
    stages.forEach((stage, idx) => {
      const liHTML = `
        <div class="timeline-marker">${idx + 1}</div>
        <div class="timeline-content">
          <div>
            <div class="timeline-title">${stage.title}</div>
            <div class="timeline-description">${stage.desc}</div>
          </div>
          <div class="timeline-time">${formatTime(stage.duration)}</div>
        </div>
      `;
      const li1 = document.createElement("li");
      li1.className = "timeline-item";
      li1.innerHTML = liHTML;
      selectors.timelineList.appendChild(li1);

      const li2 = document.createElement("li");
      li2.className = "timeline-item";
      li2.innerHTML = liHTML;
      selectors.modalTimelineList.appendChild(li2);
    });

    // Render Chef Tips Lists
    selectors.chefTipsList.innerHTML = "";
    selectors.modalChefTipsList.innerHTML = "";
    chefTips.forEach(tip => {
      const li1 = document.createElement("li");
      li1.innerHTML = tip;
      selectors.chefTipsList.appendChild(li1);

      const li2 = document.createElement("li");
      li2.innerHTML = tip;
      selectors.modalChefTipsList.appendChild(li2);
    });
  }

  // --- TIMER STATE AND ENGINE ---
  function initTimer() {
    clearInterval(state.timerIntervalId);
    state.currentStageIndex = 0;
    state.isCookComplete = false;
    setupActiveStage();
    renderMiniTimelineBubbles();
  }

  function setupActiveStage() {
    const stage = state.stages[state.currentStageIndex];
    state.timerSecondsLeft = stage.duration;
    state.timerTotalDuration = stage.duration;

    selectors.timerClock.innerText = formatTime(state.timerSecondsLeft);
    selectors.timerStageTitle.innerText = stage.title;
    selectors.stageDescTitle.innerText = stage.title;
    selectors.stageDescText.innerText = stage.desc;

    selectors.timerStageIndicator.innerText = `Stage ${state.currentStageIndex + 1} of ${state.stages.length}`;

    updateProgressRing();
    updateMiniTimelineBubbles();
  }

  function renderMiniTimelineBubbles() {
    selectors.progressBarSteps.innerHTML = "";
    state.stages.forEach((_, idx) => {
      const bubble = document.createElement("div");
      bubble.className = "step-bubble";
      selectors.progressBarSteps.appendChild(bubble);
    });
    updateMiniTimelineBubbles();
  }

  function updateTimelineHighlighting(isDone = false) {
    const timelineItems = selectors.timelineList.children;
    const modalTimelineItems = selectors.modalTimelineList.children;

    for (let i = 0; i < timelineItems.length; i++) {
      if (!isDone && i === state.currentStageIndex) {
        timelineItems[i].classList.add("active");
      } else {
        timelineItems[i].classList.remove("active");
      }
    }

    for (let i = 0; i < modalTimelineItems.length; i++) {
      if (!isDone && i === state.currentStageIndex) {
        modalTimelineItems[i].classList.add("active");
      } else {
        modalTimelineItems[i].classList.remove("active");
      }
    }
  }

  function updateMiniTimelineBubbles() {
    const bubbles = selectors.progressBarSteps.children;
    for (let i = 0; i < bubbles.length; i++) {
      bubbles[i].className = "step-bubble";
      if (i < state.currentStageIndex) {
        bubbles[i].classList.add("completed");
      } else if (i === state.currentStageIndex) {
        bubbles[i].classList.add("current");
      }
    }
    updateTimelineHighlighting(false);
  }

  function updateProgressRing() {
    const elapsedPercent = (state.timerTotalDuration - state.timerSecondsLeft) / state.timerTotalDuration;
    const offset = circumference - (elapsedPercent * circumference);
    selectors.circleProgress.style.strokeDashoffset = offset;
  }

  function startTimer() {
    if (state.isCookComplete) return;
    initAudio();
    if (state.timerIntervalId) return;

    state.isTimerRunning = true;
    selectors.playPauseIcon.innerText = "⏸️";

    state.timerIntervalId = setInterval(() => {
      state.timerSecondsLeft--;

      // Update UI Clock & progress ring
      selectors.timerClock.innerText = formatTime(state.timerSecondsLeft);
      updateProgressRing();

      // Warning beeps for last 3 seconds
      if (state.timerSecondsLeft > 0 && state.timerSecondsLeft <= 3) {
        alertStageWarning();
      }

      // Stage Complete
      if (state.timerSecondsLeft <= 0) {
        goToNextStage();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(state.timerIntervalId);
    state.timerIntervalId = null;
    state.isTimerRunning = false;
    selectors.playPauseIcon.innerText = "▶️";
  }

  function goToNextStage() {
    if (state.currentStageIndex < state.stages.length - 1) {
      alertStageChange();
      state.currentStageIndex++;
      setupActiveStage();
    } else {
      // All stages completed!
      state.isCookComplete = true;
      pauseTimer();
      alertCookComplete();
      selectors.timerClock.innerText = "DONE";
      selectors.timerStageTitle.innerText = "Perfect Steak Ready!";
      selectors.stageDescTitle.innerText = "🍽️ Rest Completed";
      selectors.stageDescText.innerText = "Your carryover rest is complete and juices have set. Slice your steak and enjoy the perfect sear!";
      selectors.circleProgress.style.strokeDashoffset = 0;
      updateMiniTimelineBubblesDone();
    }
  }

  function updateMiniTimelineBubblesDone() {
    const bubbles = selectors.progressBarSteps.children;
    for (let i = 0; i < bubbles.length; i++) {
      bubbles[i].className = "step-bubble completed";
    }
    updateTimelineHighlighting(true);
  }

  // --- BUTTON CLICKS & ROUTING ---
  selectors.calculateBtn.addEventListener("click", () => {
    calculateCookingPlan();
    transitionSection(selectors.configSection, selectors.planSection);
  });

  selectors.backToConfigBtn.addEventListener("click", () => {
    transitionSection(selectors.planSection, selectors.configSection);
  });

  selectors.startTimerBtn.addEventListener("click", () => {
    initTimer();
    transitionSection(selectors.planSection, selectors.timerSection);
  });

  // Modal toggle listeners
  selectors.viewPlanBtn.addEventListener("click", () => {
    selectors.planModal.classList.remove("hidden");
    playSound(1000, 0.05);
  });

  const closeModal = () => {
    selectors.planModal.classList.add("hidden");
    playSound(1000, 0.05);
  };

  selectors.closeModalBtn.addEventListener("click", closeModal);
  selectors.modalCloseActionBtn.addEventListener("click", closeModal);

  // Close modal when clicking outside the card
  selectors.planModal.addEventListener("click", (e) => {
    if (e.target === selectors.planModal) {
      closeModal();
    }
  });

  // Exit active timer back to the plan
  selectors.exitTimerBtn.addEventListener("click", () => {
    pauseTimer();
    transitionSection(selectors.timerSection, selectors.planSection);
  });

  selectors.playPauseBtn.addEventListener("click", () => {
    if (state.isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  selectors.skipStageBtn.addEventListener("click", () => {
    if (state.isCookComplete) return;
    // If running, warn and transition
    if (state.currentStageIndex < state.stages.length - 1) {
      state.currentStageIndex++;
      setupActiveStage();
      playSound(1000, 0.25);
    } else {
      goToNextStage();
    }
  });

  selectors.resetTimerBtn.addEventListener("click", () => {
    pauseTimer();
    initTimer();
  });

  selectors.soundToggleBtn.addEventListener("click", () => {
    state.isMuted = !state.isMuted;
    if (state.isMuted) {
      selectors.soundIcon.innerText = "🔇";
      selectors.soundToggleBtn.title = "Unmute Sound";
    } else {
      selectors.soundIcon.innerText = "🔊";
      selectors.soundToggleBtn.title = "Mute Sound";
      // play a quick beep to confirm audio works
      playSound(880, 0.1);
    }
  });

  // --- UTILITY FUNCTIONS ---
  function transitionSection(from, to) {
    from.classList.add("hidden");
    to.classList.remove("hidden");
  }

  function getSurfaceName(surface) {
    switch (surface) {
      case "cast-iron": return "cast iron skillet";
      case "stainless": return "stainless steel pan";
      case "grill": return "outdoor grill";
      case "nonstick": return "non-stick pan";
      default: return "pan";
    }
  }

  function getMethodName(method) {
    switch (method) {
      case "pan-sear": return "Traditional Pan Sear / Grill";
      case "oven-finish": return "Sear & Oven Finish";
      case "reverse-sear": return "Reverse Sear (Bake then Sear)";
      case "sous-vide": return "Sous-Vide & Quick Sear";
      default: return "Classic Cook";
    }
  }

  function getMethodDesc(method, thickness, doneness) {
    switch (method) {
      case "pan-sear":
        return `Ideal for thin-cut steaks (${thickness}"). Direct high heat cooks the center quickly while developing an outstanding outer crust.`;
      case "oven-finish":
        return `Ideal for medium-thickness steaks (${thickness}"). Searing locks in color first, and finishing in a hot oven ensures the interior reaches ${doneness} without burning the surface.`;
      case "reverse-sear":
        return `The absolute gold standard for thick-cut steaks (${thickness}"). Low-temperature slow baking ensures even edge-to-edge ${doneness}, followed by a high-heat sear for an incredible crust.`;
      case "sous-vide":
        return `Precision cooking. Submerging the steak ensures the meat reaches exactly ${doneness} from edge to edge with zero moisture loss, followed by an intense quick sear for the crust.`;
      default:
        return "Cooking plan tailored to your steak selection.";
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function formatTotalTime(seconds) {
    const mins = Math.round(seconds / 60);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
    }
    return `${mins} mins`;
  }

  // --- INITIALIZE PAGE ---
  updateThicknessDisplay(state.thickness);
  updateMethodRecommendation();
  validateInputs();
});
