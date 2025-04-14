#include "MAX30105.h"
#include "heartRate.h"
#include "sensors.h"
#include "gsr.h"

MAX30105 particleSensor;

const byte RATE_SIZE = 4; //Increase this for more averaging. 4 is good.
byte rates[RATE_SIZE]; //Array of heart rates
byte rateSpot = 0;
long lastBeat = 0; //Time at which the last beat occurred

float beatsPerMinute;
int beatAvg;

void setupSensors()
{
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) //Use default I2C port, 400kHz speed
  {
    Serial.println("MAX30105 was not found. Please check wiring/power. ");
    while (1) Serial.print('*');
  }
  Serial.println("Place your index finger on the sensor with steady pressure.");

  particleSensor.setup(); //Configure sensor with default settings
  particleSensor.setPulseAmplitudeRed(0x0A); //Turn Red LED to low to indicate sensor is running
  particleSensor.setPulseAmplitudeGreen(0); //Turn off Green LED
  particleSensor.enableDIETEMPRDY();
}

void printSensorData(const SensorData &data) {
  Serial.println("--- Sensor Readings ---");
  Serial.print("GSR: "); Serial.println(data.GSR);
  Serial.print("Temperature: "); Serial.println(data.temperature);
  Serial.print("IR: "); Serial.println(data.IR);
  Serial.print("BPM: "); Serial.println(data.BPM);
  Serial.print("Avg BPM: "); Serial.println(data.avgBPM);
  if(data.noFinger) Serial.println("No Finger? ");
}

void printCSV(const SensorData &data) {
  Serial.print(millis());          Serial.print(",");
  Serial.print(data.GSR);          Serial.print(",");
  Serial.print(data.temperature);  Serial.print(",");
  Serial.print(data.IR);           Serial.print(",");
  Serial.print(data.BPM);          Serial.print(",");
  Serial.print(data.avgBPM);       Serial.print(",");
  Serial.println(data.noFinger ? "1" : "0");  // 1=true, 0=false
}

SensorData readSensorsData()
{
    SensorData data;

    float temperature = particleSensor.readTemperature();
    long irValue = particleSensor.getIR();

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

    data.GSR = readGSR();
    data.temperature = temperature;
    data.IR = irValue;
    data.BPM = beatsPerMinute;
    data.avgBPM = beatAvg;
    data.noFinger = irValue < 50000;

    return data;
}