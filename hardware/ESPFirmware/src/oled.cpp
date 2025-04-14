#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "data.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 32 
#define OLED_RESET     -1 
#define SCREEN_ADDRESS 0x3C 

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define LOGO_HEIGHT   16
#define LOGO_WIDTH    16

const char* varNames[3] = {"Temp", "HR", "GSR"};

// Smiley face bitmap (8x8 pixels)
const unsigned char smiley[] PROGMEM = {
  0b00111100,
  0b01000010,
  0b10100101,
  0b10000001,
  0b10100101,
  0b10011001,
  0b01000010,
  0b00111100
};

void drawWifiIcon(int x, int y) {
    display.drawCircle(x, y, 2, SSD1306_WHITE);  // Inner dot
    display.drawCircle(x, y, 5, SSD1306_WHITE);  // Outer ring
}

void drawStatusDot(int x, int y, bool isActive) {
    if (isActive) {
        display.fillCircle(x, y, 2, SSD1306_WHITE);  // "Green" (bright white)
    } else {
        display.drawCircle(x, y, 2, SSD1306_WHITE);   // "White" (hollow, dimmer)
    }
}

void drawLayout(bool wifiConnected) {
    display.clearDisplay();

    // Draw smiley face (8x8)
    display.drawBitmap(0, 0, smiley, 8, 8, SSD1306_WHITE);
    
    // Set text properties
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 0);
    display.print("Auticare");
    
    // Draw "Auticare" on top-left
    display.setCursor(0, 0);
    display.print("Auticare");

    display.setCursor(20, 10);
    display.print("Connecting to");
    display.setCursor(35, 20);
    display.print(" network...");
    
    // Draw WiFi icon and status dot on top-right
    int wifiX = SCREEN_WIDTH - 20;
    int dotX = SCREEN_WIDTH - 10;
    drawWifiIcon(wifiX, 5);
    drawStatusDot(dotX, 5, wifiConnected);
    
    display.display();  // Update OLED
}

void setupOLED(){
    if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("SSD1306 allocation failed"));
        for(;;); // Don't proceed, loop forever on fail
    }
    display.display();
    delay(2000); // Pause for x seconds
    drawLayout(true);
}

void displayData(const SensorData &data) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);

    if (data.noFinger) {
        // No finger detected: Show warning message
        display.setCursor(0, 0);
        display.setTextSize(1);
        display.println("  No contact detected");
        display.setCursor(0, 16);
        display.println(" Please wear device");
    } else {
        // Finger detected: Show formatted data
        display.setCursor(0, 0);
        display.println("Auticare");
        display.drawLine(0, 10, 128, 10, SSD1306_WHITE);  // Horizontal line separator

        // Row 1: Temp and HR
        display.setCursor(0, 12);
        display.print("Temp: "); 
        display.print(data.temperature, 1); 
        display.print(" C");
        
        display.setCursor(64, 12);
        display.print("HR: "); 
        display.print(data.BPM, 1); 
        display.print(" BPM");

        // Row 2: GSR (full width)
        display.setCursor(0, 22);
        display.print("GSR: "); 
        display.print(data.GSR);
    }

    display.display();
}