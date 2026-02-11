# Screenshot Guide 📸

This directory contains screenshots for the main README.md file.

## Screenshots Needed

### 1. Home Page (`home-page.png`)
**What to capture:**
- Main game selection screen
- Show both game cards (Notes and Frequency Recognition)
- Include the navbar at the top
- Make sure user is logged in to show gamification features

**Recommended steps:**
1. Navigate to http://localhost:5173
2. Log in as a user
3. Take full-page screenshot
4. Crop to focus on content area (1200px wide recommended)

---

### 2. Note Identification Game (`note-game.png`)
**What to capture:**
- Piano-style note selection interface
- Show the audio player
- Display the score and attempts counter
- Include at least one note selected (highlighted)

**Recommended steps:**
1. Click on "Notes" game from home
2. Wait for a challenge to load
3. Select a note to show the highlight effect
4. Take screenshot before submitting

---

### 3. Frequency Recognition Game - Playing (`frequency-game-playing.png`)
**What to capture:**
- The "Play Original" and "Play Modified" buttons
- Show difficulty level selector (Beginner/Intermediate/Advanced)
- Display the score counter at the top

**Recommended steps:**
1. Navigate to Frequency Recognition game
2. Select a difficulty (e.g., Beginner)
3. Click "Start Training"
4. Take screenshot of the audio player section

---

### 4. Frequency Recognition Game - Selecting (`frequency-game-selecting.png`)
**What to capture:**
- The 5 frequency band buttons (Bass, Low Mids, Mids, High Mids, Treble)
- The Boost/Cut selection buttons
- Show one frequency band selected
- Show one boost/cut option selected

**Recommended steps:**
1. In the Frequency game, after playing audio
2. Click on a frequency band (e.g., "Mids")
3. Click on either "Boost" or "Cut"
4. Take screenshot showing both selections highlighted
5. **Don't click submit yet** - we want to show the selection state

---

### 5. Level Up Modal (`level-up.png`)
**What to capture:**
- The level up celebration modal/popup
- Show new level number
- Display XP earned
- Confetti or celebration effects if visible

**Recommended steps:**
1. Play a game until you level up (or trigger it manually if possible)
2. Take screenshot immediately when the modal appears
3. Make sure the modal is centered and clearly visible

**Note:** You may need to play multiple games or trigger this manually in dev tools if needed.

---

### 6. Achievement Unlock Modal (`achievement-unlock.png`)
**What to capture:**
- Achievement unlock notification/modal
- Show achievement icon and name
- Display description if visible
- Include celebration effects

**Recommended steps:**
1. Trigger an achievement (e.g., "First Win" or "Perfect Score")
2. Capture the modal when it appears
3. Ensure the achievement details are clearly visible

**Note:** Similar to level up, you may need to trigger this through gameplay.

---

### 7. Navigation Bar (`navigation.png`)
**What to capture:**
- Full navigation bar
- Show user dropdown expanded
- Display XP progress bar
- Show level badge
- Include Profile and Logout options

**Recommended steps:**
1. Click on the user profile button in the navbar
2. Dropdown should open showing XP bar and menu
3. Take screenshot with dropdown open
4. Ensure the XP progress bar is visible

---

## Screenshot Specifications

### Recommended Settings:
- **Format:** PNG (for transparency and quality)
- **Width:** 1200px (will scale nicely in README)
- **Browser:** Chrome or Firefox in desktop mode
- **Window size:** Maximize browser or set to 1920x1080
- **Device toolbar:** Off (unless showing mobile responsiveness)

### Screenshot Tools:
- **macOS:** Cmd + Shift + 4 (selection tool)
- **Windows:** Windows + Shift + S (Snipping Tool)
- **Browser Extension:** [Awesome Screenshot](https://www.awesomescreenshot.com/)
- **Full Page:** Use browser dev tools or extensions for full-page captures

### Tips:
1. **Clear browser cache** before taking screenshots for fresh state
2. **Use consistent dummy data** (same username, consistent scores)
3. **Crop out browser chrome** (address bar, bookmarks, etc.)
4. **Ensure good lighting/contrast** in the UI
5. **Avoid sensitive data** (real email addresses, etc.)

---

## After Taking Screenshots

1. Save all screenshots in this `screenshots/` directory
2. Use exact filenames as specified above
3. Commit and push to git:
   ```bash
   git add screenshots/
   git commit -m "Add screenshots to README"
   git push
   ```

4. Verify README displays correctly on GitHub

---

## Optional: Add More Screenshots

Feel free to add additional screenshots for:
- Mobile responsive views
- Game history page
- Profile page
- Different game states (correct answer, incorrect answer, game over)
- Any other interesting features!

Just update the README.md to reference any new screenshots you add.
