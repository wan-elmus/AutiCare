#include "MAX30105.h"
#include "heartRate.h"
#include "pulse.h"

MAX30105 pulseOximeter;

const byte RATE_SIZE = 4; //Increase this for more averaging. 4 is good.
byte rates[RATE_SIZE]; //Array of heart rates
byte rateSpot = 0;
long lastBeat = 0; //Time at which the last beat occurred 
float beatsPerMinute;
int beatAvg;

void setupPulseSensor(){
    // Initialize sensor
    if (pulseOximeter.begin(Wire, I2C_SPEED_FAST) == false)
    {
        Serial.println("MAX30100 was not found. Please check wiring/power. ");
        while (1);
    }
    Serial.println("Place your index finger on the sensor with steady pressure.");
    pulseOximeter.setup(0);
    pulseOximeter.setPulseAmplitudeRed(0x0A); //Turn Red LED to low to indicate sensor is running
    pulseOximeter.setPulseAmplitudeGreen(0); //Turn off Green LED
}

int readPulse(){
    long irValue = pulseOximeter.getIR();

    if (checkForBeat(irValue) == true)
    {
        //We sensed a beat!
        long delta = millis() - lastBeat;
        lastBeat = millis();

        beatsPerMinute = 60 / (delta / 1000.0);

        if (beatsPerMinute < 255 && beatsPerMinute > 20)
        {
        rates[rateSpot++] = (byte)beatsPerMinute; //Store this reading in the array
        rateSpot %= RATE_SIZE; //Wrap variable

        //Take average of readings
        beatAvg = 0;
        for (byte x = 0 ; x < RATE_SIZE ; x++)
            beatAvg += rates[x];
        beatAvg /= RATE_SIZE;
        }
    }

    Serial.print("IR=");
    Serial.print(irValue);
    Serial.print(", BPM=");
    Serial.print(beatsPerMinute);
    Serial.print(", Avg BPM=");
    Serial.print(beatAvg);

    if (irValue < 50000)
        Serial.print(" No finger?");

    Serial.println();
    return 0;
}