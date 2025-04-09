#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

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
    
    // Draw WiFi icon and status dot on top-right
    int wifiX = SCREEN_WIDTH - 20;
    int dotX = SCREEN_WIDTH - 10;
    drawWifiIcon(wifiX, 5);
    drawStatusDot(dotX, 5, wifiConnected);
    
    display.display();  // Update OLED
}

void setupOLED(bool wifiConnected){
    if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
        Serial.println(F("SSD1306 allocation failed"));
        for(;;); // Don't proceed, loop forever on fail
    }
    display.display();
    delay(2000); // Pause for x seconds
    drawLayout(wifiConnected);
}

void displayData(float payload[5]){
    display.setCursor(0, 10);
    display.print(varNames[0]); display.print(":"); display.print(payload[0], 1);
    display.print(" ");
    display.print(varNames[1]); display.print(":"); display.print(payload[1], 1);
    
    display.setCursor(0, 20);
    display.print(varNames[2]); display.print(":"); display.print(payload[2], 1);
    
    display.display();
}