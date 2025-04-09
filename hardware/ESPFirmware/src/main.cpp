#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include "defs.h"
#include "postman.h"
#include "pulse.h"
#include "oled.h"

void setup()
{
    Serial.begin(BAUD_RATE);
    // setupOLED(setupWiFi());
    setupPulseSensor();
}


void loop()
{
    readPulse();
    float payload[5] = {25.5, 72.0, 450.5, 37.7749, -122.4194};
    // displayData(payload);
    // send(payload);
}
