- turn on CanvasHTML5 and ADM plugins via the menu
- enter bridge-cat-eden into the JS-Eden input window
- open an ADM Advanced Input view and enter in bridge-cat-adm code
- open up ADM Human Perspective and start executing actions

Notes
Enums are not available in JS-Eden so instead I use integers. For the flap position, lock, cat intention and position the same integers are used:
1 - out
0 - vertical / central / no intention
-1 - in
For example a cat intention of -1 means the cat intends to move outside.

The cat begins inside the house on the left of the animation.

The human perspective allows the cat to act non-deterministically as mentioned in the original LSD specification, according to how the modeller or super user chooses for the cat to act.

Changes from Bridge's LSD Specification
In this example I made a few changes away from Bridge's LSD specification based on my own experimentation, and implementation issues with JS-Eden. These changes and the motivation behind them are discussed below.

Firstly JS-Eden does not implement power sets. So instead the set of set lock positions is changed to two definitions - one for the outside lock, one for the inside lock. These are part of the flap and so belong to that entity. The actions for "man" are also updated correspondingly, to be able to flip the status of the lock as long as the flap is currently in the vertical position (0).

Secondly the specification for the cat suggests that it should only be able to stop pushing if it is not currently engaged, ie next to the cat flap. This was changed as the cat should be able to stop pushing at any time.

Movement conditions on the cat were also changed so it could move in either direction if away from the flap, regardless of its intentions, indicating that it is free to move in either the inside or the outside world. This was also required to allow the cat to move towards the flap from its starting position.

The actions for the flap were also changed so the action to change flap position was only available if the flap was not currently in that position.

The guard for the cat to begin pushing in a direction was changed so this can only happen if it is currently engaged. This was probably needed because of the addition of the cat being allowed to move fully away from the flap.

An extra guard was also added to the action which moves the flap back to the vertical position so that it can't close whilst the cat is underneath it. For this an extra definition was also added to the cat to indicate when it is underneath. This was probably needed as the original specification did not allow the cat to stop whilst under the flap and change its mind.
