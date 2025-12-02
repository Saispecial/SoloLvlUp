import { App } from "@capacitor/app"
import { StatusBar, Style } from "@capacitor/status-bar"
import { SplashScreen } from "@capacitor/splash-screen"
import { Keyboard } from "@capacitor/keyboard"

export async function initializeCapacitor() {
  try {
    // Handle app back button
    App.addListener("backButton", ({ canGoBack }) => {
      if (!canGoBack) {
        App.exitApp()
      } else {
        window.history.back()
      }
    })

    // Configure status bar
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: "#1a1a2e" })

    // Hide splash screen after app loads
    await SplashScreen.hide()

    // Handle keyboard
    await Keyboard.setAccessoryBarVisible({ isVisible: true })
  } catch (error) {
    console.log("[Capacitor] Platform is web, skipping native initialization")
  }
}
