/* Start of Arduino sketch */

#include <Servo.h>

int pin;
byte value;
int device;
Servo srv;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  //srv.attach(52); // hard code servo to this pin
}
// Incoming protocol: pin value device
// supported devices
// 4: analog port (for example PWM led)
// 3: digital port (LOW/HIGH, not implemented yet)
// 5: servo (0-180)
void loop() {
  // put your main code here, to run repeatedly:
  while(Serial.available() < 3);  //wait until a byte was received
    pin = Serial.read();
    value = Serial.read();
    device = Serial.read();

	if (device == 1) {
		if (value == 1) {
			pinMode(pin, INPUT);
		} else {
			pinMode(pin, OUTPUT);
		}
    } else if (device == 4) {
      analogWrite(pin, value);//output received byte
    } else if (device == 3) {
	  if (value == 0) {
		digitalWrite(pin, LOW);
	  } else {
		digitalWrite(pin, HIGH);
	  }
     // srv.write(value);
     // delay(15);
    }
}
/* End of Arduino sketch */
