// Store the original theme state before entering lyrics page
let originalThemeState = null

// Store original footer styles to restore them properly
const originalStyles = {
  footerContent: {
    display: "",
    flexDirection: "",
  },
  topNav: {
    borderTop: "",
    borderBottom: "",
    borderColor: "",
  },
  bottomControls: {
    justifyContent: "",
  },
  songInfo: {
    display: "",
  },
  progressBar: {
    flex: "",
    marginLeft: "",
    marginRight: "",
    width: "",
  },
}

// Track the previous view to handle all view transitions
let previousView = null

// Store the original lyrics button text (localized)
let originalLyricsText = ""

// Interval ID for updating lyrics in the footer
let lyricsUpdateInterval = null

// Keep track of the last displayed lyric to prevent unnecessary updates
let lastDisplayedLyricId = null

document.addEventListener("DOMContentLoaded", () => {
  // Get the Vue instance
  const vueApp = document.querySelector("#app").__vue__

  if (vueApp) {
    // Add transition styles to the DOM
    addTransitionStyles()

    // Save original footer styles when the page loads
    saveOriginalFooterStyles()

    // Save original lyrics button text (localized)
    const lyricsButton =
      document.querySelector('footer button[data-view="lyrics"]') ||
      document.querySelector("footer button:nth-child(3)")
    if (lyricsButton) {
      // Find the text span inside the button
      const textSpan = lyricsButton.querySelector("span")
      if (textSpan) {
        // Save the localized text
        originalLyricsText = textSpan.textContent
      }
    }

    // Set initial previous view
    previousView = vueApp.currentView

    // Watch for changes to currentView
    vueApp.$watch("currentView", (newView, oldView) => {
      // Handle dark mode for lyrics page
      if (newView === "lyrics") {
        // Store the original dark mode state
        originalThemeState = vueApp.isDarkMode

        // Force dark mode if not already in dark mode
        if (!vueApp.isDarkMode) {
          vueApp.isDarkMode = true
          document.documentElement.classList.add("dark")
          document.documentElement.classList.remove("light")
          vueApp.updateOverlayColor()
          vueApp.updateFeatherIcons()
        }

        // Restore original lyrics text when entering lyrics page
        restoreLyricsButtonText(vueApp)

        // Clear the update interval if it exists
        if (lyricsUpdateInterval) {
          clearInterval(lyricsUpdateInterval)
          lyricsUpdateInterval = null
        }
      }
      // When leaving lyrics page
      else if (oldView === "lyrics" && originalThemeState !== null) {
        // Restore original theme state
        if (originalThemeState !== vueApp.isDarkMode) {
          vueApp.isDarkMode = originalThemeState

          if (vueApp.isDarkMode) {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
          } else {
            document.documentElement.classList.add("light")
            document.documentElement.classList.remove("dark")
          }

          vueApp.updateOverlayColor()
          vueApp.updateFeatherIcons()
        }

        // Start updating lyrics in the footer
        startLyricsUpdate(vueApp)
      }
      // When switching to any view other than lyrics
      else if (newView !== "lyrics" && !lyricsUpdateInterval) {
        // Start updating lyrics in the footer
        startLyricsUpdate(vueApp)
      }

      // Handle footer layout for all view transitions
      handleFooterLayout(newView, vueApp.isDarkMode)

      // Update previous view
      previousView = newView
    })

    // Initial layout setup based on current view
    handleFooterLayout(vueApp.currentView, vueApp.isDarkMode)

    // Start updating lyrics if not initially on lyrics page
    if (vueApp.currentView !== "lyrics") {
      startLyricsUpdate(vueApp)
    }
  }
})

/**
 * Starts the interval to update the lyrics text in the footer
 * @param {Object} vueApp - The Vue instance
 */
function startLyricsUpdate(vueApp) {
  // Clear any existing interval
  if (lyricsUpdateInterval) {
    clearInterval(lyricsUpdateInterval)
  }

  // Reset the last displayed lyric
  lastDisplayedLyricId = null

  // Set up interval to update lyrics - less frequent to reduce flashing
  lyricsUpdateInterval = setInterval(() => {
    updateLyricsInFooter(vueApp)
  }, 1000) // Update every second instead of 500ms

  // Also update immediately
  updateLyricsInFooter(vueApp)
}

/**
 * Updates the lyrics text in the footer with the current playing lyric
 * @param {Object} vueApp - The Vue instance
 */
function updateLyricsInFooter(vueApp) {
  // Find the lyrics button
  const lyricsButton =
    document.querySelector('footer button[data-view="lyrics"]') || document.querySelector("footer button:nth-child(3)")

  if (!lyricsButton) return

  // Find the text span inside the button
  const textSpan = lyricsButton.querySelector("span")
  if (!textSpan) return

  // Get current lyric and translation from Vue app
  const { lyricText, translation, lyricId } = getCurrentLyricWithTranslation(vueApp)

  // Only update if the lyric has changed (prevents constant flashing)
  if (lyricId !== lastDisplayedLyricId && lyricText && lyricText.trim() !== "") {
    lastDisplayedLyricId = lyricId

    // Truncate long lyrics
    const maxLength = 15
    let displayText = lyricText.length > maxLength ? lyricText.substring(0, maxLength) + "..." : lyricText

    // Add translation if available
    if (translation && translation.trim() !== "") {
      const truncatedTranslation =
        translation.length > maxLength ? translation.substring(0, maxLength) + "..." : translation

      // Add translation with 60% opacity using a span
      displayText = `${displayText}  <span style="opacity: 0.6;">${truncatedTranslation}</span>`
    }

    // Update the text with a fade effect, but only if it's different
    if (textSpan.innerHTML !== displayText) {
      textSpan.style.transition = "opacity 0.3s ease"
      textSpan.style.opacity = "0"

      setTimeout(() => {
        textSpan.innerHTML = displayText
        textSpan.style.opacity = "1"
      }, 300)
    }
  }
}

/**
 * Gets the current lyric and its translation from the Vue app
 * @param {Object} vueApp - The Vue instance
 * @returns {Object} Object containing lyric text, translation, and a unique ID
 */
function getCurrentLyricWithTranslation(vueApp) {
  // Check if there's an active lyric
  if (vueApp.lyrics && vueApp.lyrics.length > 0 && vueApp.activeLyricIndex >= 0) {
    const activeLyric = vueApp.lyrics[vueApp.activeLyricIndex]
    if (activeLyric && activeLyric.parts) {
      // Join all parts of the lyric
      const lyricText = activeLyric.parts.map((part) => part.text).join("")

      // Get translation if available
      const translation = vueApp.translations && activeLyric.time ? vueApp.translations[activeLyric.time] : null

      // Create a unique ID for this lyric (time + text)
      const lyricId = `${activeLyric.time}-${lyricText}`

      return { lyricText, translation, lyricId }
    }
  }
  return { lyricText: "", translation: null, lyricId: null }
}

/**
 * Restores the original lyrics button text using the localized value
 * @param {Object} vueApp - The Vue instance
 */
function restoreLyricsButtonText(vueApp) {
  // Find the lyrics button
  const lyricsButton =
    document.querySelector('footer button[data-view="lyrics"]') || document.querySelector("footer button:nth-child(3)")

  if (!lyricsButton) return

  // Find the text span inside the button
  const textSpan = lyricsButton.querySelector("span")
  if (!textSpan) return

  // Get the localized text from i18n if possible, otherwise use saved text
  const localizedText = vueApp.$t && typeof vueApp.$t === "function" ? vueApp.$t("lyrics") : originalLyricsText

  // Restore original text with fade effect
  textSpan.style.transition = "opacity 0.3s ease"
  textSpan.style.opacity = "0"

  setTimeout(() => {
    textSpan.textContent = localizedText
    textSpan.style.opacity = "1"
  }, 300)
}

/**
 * Adds transition styles to the document for smooth animations
 */
function addTransitionStyles() {
  const styleElement = document.createElement("style")
  styleElement.textContent = `
    .footer-content {
      transition: flex-direction 0.3s ease;
    }
    .footer-content > div {
      transition: all 0.3s ease;
    }
    .footer-content .flex.items-center.space-x-3 {
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .footer-transition-hide {
      opacity: 0 !important;
      transform: translateY(10px);
    }
    .footer-transition-show {
      opacity: 1;
      transform: translateY(0);
    }
    .progress-bar-container {
      transition: flex 0.3s ease, width 0.3s ease, margin 0.3s ease;
    }
    .progress-bar-expanded {
      flex: 1 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      width: 100% !important;
    }
  `
  document.head.appendChild(styleElement)
}

/**
 * Saves the original footer styles to restore them later
 */
function saveOriginalFooterStyles() {
  const footer = document.querySelector("footer")
  if (!footer) return

  const footerContent = footer.querySelector(".footer-content")
  if (!footerContent) return

  const topNav = footerContent.querySelector(".h-12") // Top navigation bar
  const bottomControls = footerContent.querySelector(".h-16") // Bottom playback controls
  const songInfo = bottomControls.querySelector(".flex.items-center.space-x-3") // Song info section

  // Find the progress bar container (the div containing the progress bar)
  const progressBarContainer = bottomControls.querySelector(".hidden.sm\\:flex.flex-1.items-center")

  // Save original styles
  originalStyles.footerContent.display = getComputedStyle(footerContent).display
  originalStyles.footerContent.flexDirection = getComputedStyle(footerContent).flexDirection

  originalStyles.topNav.borderTop = getComputedStyle(topNav).borderTop
  originalStyles.topNav.borderBottom = getComputedStyle(topNav).borderBottom
  originalStyles.topNav.borderColor = getComputedStyle(topNav).borderColor

  originalStyles.bottomControls.justifyContent = getComputedStyle(bottomControls).justifyContent

  if (songInfo) {
    originalStyles.songInfo.display = getComputedStyle(songInfo).display
  }

  if (progressBarContainer) {
    originalStyles.progressBar.flex = getComputedStyle(progressBarContainer).flex
    originalStyles.progressBar.marginLeft = getComputedStyle(progressBarContainer).marginLeft
    originalStyles.progressBar.marginRight = getComputedStyle(progressBarContainer).marginRight
    originalStyles.progressBar.width = getComputedStyle(progressBarContainer).width

    // Add a class for easier selection
    progressBarContainer.classList.add("progress-bar-container")
  }
}

/**
 * Handles the footer layout changes based on the current view
 * @param {string} currentView - The current view name
 * @param {boolean} isDarkMode - Whether dark mode is active
 */
function handleFooterLayout(currentView, isDarkMode) {
  // Get footer elements
  const footer = document.querySelector("footer")
  if (!footer) return

  const footerContent = footer.querySelector(".footer-content")
  if (!footerContent) return

  const topNav = footerContent.querySelector(".h-12") // Top navigation bar
  const bottomControls = footerContent.querySelector(".h-16") // Bottom playback controls
  const songInfo = bottomControls.querySelector(".flex.items-center.space-x-3") // Song info section
  const progressBarContainer = bottomControls.querySelector(".progress-bar-container") // Progress bar container

  // Always start by restoring original styles for all elements
  // This ensures we have a clean slate for any view transition
  restoreOriginalStyles(footerContent, topNav, bottomControls, songInfo, progressBarContainer)

  // Then apply specific styles for the current view
  if (currentView === "nowPlaying") {
    // When in Now Playing view:
    // 1. Hide song info with animation
    if (songInfo) {
      songInfo.classList.add("footer-transition-hide")
      // After animation completes, hide the element
      setTimeout(() => {
        songInfo.style.display = "none"

        // Expand the progress bar after song info is hidden
        if (progressBarContainer) {
          progressBarContainer.classList.add("progress-bar-expanded")
          progressBarContainer.style.display = "flex" // Ensure it's visible on mobile
        }
      }, 300)
    } else {
      // If song info doesn't exist, expand progress bar immediately
      if (progressBarContainer) {
        progressBarContainer.classList.add("progress-bar-expanded")
        progressBarContainer.style.display = "flex" // Ensure it's visible on mobile
      }
    }

    // 2. Swap the order of navigation and playback controls
    footerContent.style.display = "flex"
    footerContent.style.flexDirection = "column-reverse"

    // Add some styling to make it look better
    topNav.style.borderTop = "1px solid"
    topNav.style.borderBottom = "none"

    // Set border color based on theme
    const borderColor = isDarkMode ? "rgba(75, 85, 99, 0.5)" : "rgba(209, 213, 219, 0.5)"
    topNav.style.borderColor = borderColor

    // Adjust spacing
    bottomControls.style.justifyContent = "center"
  }
}

/**
 * Restores all elements to their original styles
 */
function restoreOriginalStyles(footerContent, topNav, bottomControls, songInfo, progressBarContainer) {
  // Restore footer content styles
  footerContent.style.display = originalStyles.footerContent.display
  footerContent.style.flexDirection = originalStyles.footerContent.flexDirection

  // Restore top nav styles
  topNav.style.borderTop = originalStyles.topNav.borderTop
  topNav.style.borderBottom = originalStyles.topNav.borderBottom
  topNav.style.borderColor = originalStyles.topNav.borderColor

  // Restore bottom controls styles
  bottomControls.style.justifyContent = originalStyles.bottomControls.justifyContent

  // Restore song info styles
  if (songInfo) {
    songInfo.style.display = originalStyles.songInfo.display
    songInfo.classList.remove("footer-transition-hide")
  }

  // Restore progress bar styles
  if (progressBarContainer) {
    progressBarContainer.classList.remove("progress-bar-expanded")
    progressBarContainer.style.flex = originalStyles.progressBar.flex
    progressBarContainer.style.marginLeft = originalStyles.progressBar.marginLeft
    progressBarContainer.style.marginRight = originalStyles.progressBar.marginRight
    progressBarContainer.style.width = originalStyles.progressBar.width

    // Reset display to original (might be "none" on mobile)
    if (window.innerWidth < 640) {
      // sm breakpoint in Tailwind
      progressBarContainer.style.display = "none"
    } else {
      progressBarContainer.style.display = "flex"
    }
  }
}
