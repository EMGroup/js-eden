- turn on ADM plugin via the menu
- enter systolic-eden code into the JS-EDEN input window
- open the ADM Advanced Input view and enter in systolic-adm code
- open ADM Human Perspective. It is also recommended you use the Symbol Viewer plugin and the Observable view to watch the result matrix C being built.
- execute all available processor actions simultaneously at time 0. Then continue alternating between incrementing the time variable via the time entity and executing all available processor actions.

This model was adapted slightly from the description in "Parallel Computation in Definitive Models" (Beynon et al., 1988). The model carries out matrix multiplication A.B = C. The input arrays given in the example correspond to the computation:
1 1 1 0     2 2 0 0     6 6 4 2
1 1 1 1  .  2 2 2 0  =  6 8 6 4
0 1 1 1     2 2 2 2     4 6 6 4
0 0 1 1     0 2 2 2     2 4 4 4
These can be changed via the EDEN definitions. Computation should take 12 time steps.

The model consists of two generic entity types:
1) Time - this entity exists to increment the time variable (number of steps so far computed). It was decided including the time_changed definition was not needed with the existance of the human perspective.
2) Processor(alpha, beta) - these entities carry out the actual computation. They are parameterised with alpha in the range (-P_a, Q_a) and beta in the range (-P_b, Q_b) creating 16 instances. P and Q values are fixed in this example to the following values:
P_a = 1
Q_a = 2
P_b = 2
Q_b = 1
At processor contains definitions for i, j and k, which reference different indexes of the input and output arrays as processor progresses. At each step processors which are active carry out the action:
C(i,k) = |C(i,k)| + (A(i,j) * B(j,k))
Processors work diagonally down the input as computation progresses. Unexpectedly the correct answer is only obtained if processors are "wrapped round" and once they reach the bottom of the array they are fed the top of the array. This is achieved by using % 4 on the i, j and k definitions.


