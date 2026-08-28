# Exploring Mechanics — Repository Guide

`exploring-mechanics` is an interactive, mathematics-first repository for learning
classical mechanics through:

- Clear derivations
- Diagrams and free-body diagrams
- Simulations and numerical experiments
- Everyday applications
- Counterintuitive mechanics puzzles
- Incrementally more realistic models

The project should move from **describing motion** to **explaining motion with
forces**, then to **conservation laws, constraints, machines, rotation,
oscillations, and nonlinear mechanics**.

> **Core design principle:** Every page should start with an intuitive question,
> ask the learner to make a prediction, build a mathematical model, and then use
> a derivation or simulation to reveal what actually happens.

---

## Table of Contents

1. [Project Goals](#project-goals)
2. [Learning Path](#learning-path)
3. [How Every Topic Page Should Work](#how-every-topic-page-should-work)
4. [Repository Structure](#repository-structure)
5. [Topic Roadmap](#topic-roadmap)
   - [0. Mathematical and Modeling Toolkit](#0-mathematical-and-modeling-toolkit)
   - [1. Kinematics](#1-kinematics-describing-motion)
   - [2. Newton's Laws and Forces](#2-newtons-laws-and-forces)
   - [3. Work, Energy, and Power](#3-work-energy-and-power)
   - [4. Momentum, Impulse, and Collisions](#4-momentum-impulse-and-collisions)
   - [5. Constraints and Simple Machines](#5-constraints-and-simple-machines)
   - [6. Circular Motion and Gravitation](#6-circular-motion-and-gravitation)
   - [7. Rotational Mechanics and Rolling](#7-rotational-mechanics-and-rolling)
   - [8. Oscillations, Resonance, and Chaos](#8-oscillations-resonance-and-chaos)
   - [9. Counterintuitive Mechanics Problems](#9-counterintuitive-mechanics-problems)
   - [10. Real-World Capstone Simulations](#10-real-world-capstone-simulations)
6. [Suggested First Release](#suggested-first-release)
7. [Simulation Design Guidelines](#simulation-design-guidelines)
8. [Technology Suggestions](#technology-suggestions)
9. [References](#references)
10. [License and Attribution](#license-and-attribution)

---

# Project Goals

The purpose of this repository is not only to present formulas. It should help
people develop good physical intuition while also showing where intuition can
fail.

Each topic should ideally include:

- A motivating question
- A visual diagram
- Explicit assumptions
- A derivation
- A worked example
- A small experiment or simulation
- A real-world application
- An explanation of common misconceptions
- Extensions for more advanced learners

The repository should emphasize the difference between:

- **Ideal models** and real systems
- **Qualitative intuition** and quantitative calculation
- **Linear motion** and rotational motion
- **Conservation laws** and force-based methods
- **Simple systems** and systems with constraints, friction, damping, or chaos

---

# Learning Path

```text
Mathematical tools and modeling
        ↓
Kinematics: describing motion
        ↓
Newton's laws: explaining motion with forces
        ↓
Work, energy, and power
        ↓
Momentum, impulse, and collisions
        ↓
Simple machines, constraints, pulleys, and gears
        ↓
Circular motion and gravitation
        ↓
Rotational mechanics and rolling
        ↓
Oscillations, resonance, and waves
        ↓
Nonlinear, chaotic, and unintuitive mechanics
        ↓
Real-world capstone simulations
This ordering matters:

Learn to describe motion.
Learn what causes changes in motion.
Learn conservation laws that make difficult force problems easier.
Learn how constraints and machines redistribute force, distance, speed, and torque.
Learn rotational mechanics, which unlocks richer applications such as bowling, bicycle gearing, rolling motion, levers, and gyroscopes.
Finish with visually surprising problems and nonlinear systems.
How Every Topic Page Should Work
Use this standard template for every lesson or problem page.

# Problem Title

## The question

State the problem in intuitive language.

## Make a prediction

Ask the reader what they think will happen before showing the derivation or
simulation.

## Assumptions

State the idealizations clearly.

- Is friction ignored?
- Is air resistance ignored?
- Are objects rigid?
- Is gravity constant?
- Is the rope massless and inextensible?
- Is rolling without slipping assumed?
- Is the system isolated?

## Diagram

Include a labeled system diagram.

Include a free-body diagram where forces are relevant.

## Variables

Define all variables and units.

## Mathematical model

State the governing equations.

## Derivation

Derive the result step by step.

## Worked example

Use realistic but uncomplicated numerical values.

## Interactive simulation

Include sliders, animation, graphs, or parameter controls.

## Result

State the result clearly.

## Why this is unintuitive

Explain the most common incorrect intuition.

## Real-world limitations

Explain what the model ignores.

## Extensions

List harder versions of the problem.

## Challenge questions

Add exercises for readers to solve independently.

## References

List the sources used for the topic.
Repository Structure
exploring-mechanics/
│
├── README.md
├── guide.md
├── LICENSE
├── CONTRIBUTING.md
├── requirements.txt
├── package.json
│
├── docs/
│   ├── index.md
│   │
│   ├── 00-toolkit/
│   │   ├── index.md
│   │   ├── units-and-dimensional-analysis.md
│   │   ├── vectors-and-components.md
│   │   ├── coordinate-systems.md
│   │   ├── reference-frames.md
│   │   └── free-body-diagrams.md
│   │
│   ├── 01-kinematics/
│   │   ├── index.md
│   │   ├── constant-velocity.md
│   │   ├── constant-acceleration.md
│   │   ├── free-fall.md
│   │   ├── projectile-motion.md
│   │   └── relative-motion.md
│   │
│   ├── 02-newtons-laws/
│   │   ├── index.md
│   │   ├── inertia.md
│   │   ├── newtons-second-law.md
│   │   ├── newtons-third-law.md
│   │   ├── friction.md
│   │   ├── inclined-planes.md
│   │   └── tension-and-connected-objects.md
│   │
│   ├── 03-energy/
│   │   ├── index.md
│   │   ├── work.md
│   │   ├── kinetic-energy.md
│   │   ├── potential-energy.md
│   │   ├── conservation-of-energy.md
│   │   ├── power-and-efficiency.md
│   │   └── roller-coaster-physics.md
│   │
│   ├── 04-momentum/
│   │   ├── index.md
│   │   ├── momentum.md
│   │   ├── impulse.md
│   │   ├── collisions.md
│   │   ├── center-of-mass.md
│   │   └── ballistic-pendulum.md
│   │
│   ├── 05-simple-machines/
│   │   ├── index.md
│   │   ├── mechanical-advantage.md
│   │   ├── levers.md
│   │   ├── pulleys.md
│   │   ├── inclined-planes-and-wedges.md
│   │   ├── screws-and-wheel-axles.md
│   │   └── gears.md
│   │
│   ├── 06-circular-motion/
│   │   ├── index.md
│   │   ├── uniform-circular-motion.md
│   │   ├── banked-curves.md
│   │   ├── vertical-circles.md
│   │   ├── gravitation.md
│   │   └── orbits.md
│   │
│   ├── 07-rotation-and-rolling/
│   │   ├── index.md
│   │   ├── angular-kinematics.md
│   │   ├── torque.md
│   │   ├── moment-of-inertia.md
│   │   ├── rotational-energy.md
│   │   ├── rolling-motion.md
│   │   └── angular-momentum.md
│   │
│   ├── 08-oscillations/
│   │   ├── index.md
│   │   ├── simple-harmonic-motion.md
│   │   ├── pendulums.md
│   │   ├── damping.md
│   │   ├── driven-oscillations.md
│   │   ├── resonance.md
│   │   └── coupled-oscillators.md
│   │
│   ├── 09-unintuitive-problems/
│   │   ├── index.md
│   │   ├── double-cone-uphill.md
│   │   ├── spool-paradox.md
│   │   ├── rolling-race.md
│   │   ├── falling-slinky.md
│   │   ├── pulley-distance-puzzle.md
│   │   ├── chain-fountain.md
│   │   ├── brachistochrone.md
│   │   ├── tautochrone.md
│   │   ├── catenary.md
│   │   ├── tennis-racket-theorem.md
│   │   ├── gyroscopic-precession.md
│   │   └── bead-on-rotating-hoop.md
│   │
│   └── 10-capstones/
│       ├── index.md
│       ├── bowling-physics.md
│       ├── bicycle-mechanics.md
│       ├── roller-coaster-design.md
│       ├── bridge-resonance.md
│       ├── bow-energy-model.md
│       └── catapult-motion-model.md
│
├── simulations/
│   ├── vector-playground/
│   ├── motion-graphs/
│   ├── projectile-motion/
│   ├── inclined-plane/
│   ├── friction-and-braking/
│   ├── roller-coaster/
│   ├── collision-lab/
│   ├── lever-balance/
│   ├── pulley-system/
│   ├── gear-train/
│   ├── orbit-simulator/
│   ├── rolling-race/
│   ├── double-cone/
│   ├── double-pendulum/
│   ├── driven-oscillator/
│   └── intermediate-axis/
│
├── notebooks/
│   ├── derivations/
│   ├── numerical-methods/
│   ├── experiments/
│   └── data-analysis/
│
├── experiments/
│   ├── at-home/
│   ├── classroom/
│   ├── video-analysis/
│   └── data-collection/
│
├── assets/
│   ├── diagrams/
│   ├── images/
│   ├── videos/
│   ├── animations/
│   └── data/
│
└── references/
    ├── bibliography.md
    ├── image-attributions.md
    └── software-attributions.md
Topic Roadmap
0. Mathematical and Modeling Toolkit
This section establishes the language used throughout the repository.

Topics
Units and dimensional analysis
Cover:

Length, time, mass, force, energy, power, momentum, and torque
SI units
Unit conversion
Dimensional consistency
Scaling laws
Key ideas
Distance has dimensions of length.
Speed has dimensions of length divided by time.
Acceleration has dimensions of length divided by time squared.
Force has dimensions of mass times acceleration.
Equations must have the same dimensions on both sides.
Suggested experiments and simulations
Activity	What it teaches
Unit-conversion challenge	How to move reliably between units
Dimensional-analysis checker	How to test whether an equation could be correct
Scaling explorer	Why larger objects do not simply behave like scaled-up smaller objects
Human-scale measurements	Estimate walking speed, stair-climbing power, or reaction time
Vectors and components
Cover:

Scalar versus vector quantities
Position, displacement, velocity, acceleration, and force
Vector addition and subtraction
Components in two dimensions
Dot products and cross products as advanced material
Suggested experiments and simulations
Activity	What it teaches
Vector addition playground	How vectors combine
Force-component explorer	How an angled force splits into horizontal and vertical components
Navigation challenge	Relative displacement and direction
Free-body-diagram builder	How to identify forces acting on an object
Reference frames
Cover:

Inertial frames
Relative motion
Observers moving at different speeds
Introductory non-inertial frames
Suggested experiments and simulations
Activity	What it teaches
Train-window simulation	Relative velocity
Boat-river crossing	Velocity vectors
Moving-walkway puzzle	Frame-dependent descriptions
Rotating-platform demo	Why apparent forces can arise in non-inertial frames
1. Kinematics: Describing Motion
Kinematics describes how objects move without yet explaining why they move.

1.1 Constant velocity
Concepts
Position
Displacement
Distance
Speed
Velocity
Position-time graphs
Velocity-time graphs
Problems and applications
Catch-up problems
Overtaking vehicles
Walking on a moving walkway
Aircraft travelling with or against wind
Boats crossing a river
Experiments and simulations
Experiment / simulation	Description
Motion graph lab	Move an object at constant speed and compare motion to a position-time graph
Two-runner challenge	Find when a faster runner catches a slower runner
Relative-velocity explorer	Change the speed and direction of two moving objects
Video analysis	Track a toy car or walking person frame by frame
1.2 Constant acceleration
Core equations
v = u + at

s = ut + ½at²

v² = u² + 2as
Where:

u = initial velocity
v = final velocity
a = acceleration
t = time
s = displacement
Concepts
Constant acceleration
Velocity-time graphs
Area under a velocity-time graph
Slope of a velocity-time graph
Braking distance
Reaction time
Problems and applications
Car braking distance
Accelerating trains
Elevator motion
Sprinting
Motion down a shallow ramp
Experiments and simulations
Experiment / simulation	Description
Motion-graph explorer	Change initial velocity and acceleration, then observe graphs
Ramp experiment	Roll a cart down a ramp and estimate acceleration
Braking-distance calculator	Compare stopping distances at different speeds
Elevator apparent-weight model	Explore acceleration during lift start and stop
1.3 Free fall
Concepts
Gravitational acceleration near Earth
Free fall
Upward throws
Air resistance
Terminal velocity
Why mass does not affect ideal free-fall acceleration
Problems and applications
Dropping an object from a known height
Throwing an object vertically upward
Comparing a vacuum to air resistance
Estimating reaction time using a falling ruler
Experiments and simulations
Experiment / simulation	Description
Ruler-drop reaction-time test	Estimate reaction time from fall distance
Drop comparison	Compare compact and high-drag objects
Free-fall graph simulation	Visualize position, velocity, and acceleration versus time
Terminal-velocity model	Compare ideal free fall with drag-based motion
1.4 Projectile motion
Concepts
Horizontal and vertical components
Horizontal launch
Angled launch
Range
Maximum height
Time of flight
Launch angle
Air resistance as an advanced extension
Problems and applications
Basketball arcs
Soccer or football kicks
Water fountains
Ball clearing a wall
Educational catapult-trajectory models
Experiments and simulations
Experiment / simulation	Description
Projectile-motion explorer	Adjust launch angle, speed, height, and gravity
Target challenge	Hit a target using physics constraints
Water-stream experiment	Photograph a water arc and fit a parabola
Sports-video analysis	Trace the path of a thrown or kicked ball
Keep projectile simulations theoretical and educational. Do not include real-world weapon construction, targeting, or performance-optimization guidance.

2. Newton's Laws and Forces
This section explains why motion changes.

2.1 Newton's first law: inertia
Concepts
Net force
Inertia
Equilibrium
Constant velocity
Mass as resistance to acceleration
Demonstrations
Coin-and-card experiment
Tablecloth pull
Passengers lurching during vehicle braking
Sliding objects on low-friction surfaces
Experiments and simulations
Experiment / simulation	Description
Inertia prediction lab	Predict object motion after a force stops
Coin-and-card experiment	Demonstrate inertia with household objects
Vehicle braking simulation	Show passenger motion during deceleration
Low-friction puck simulation	Compare nearly force-free motion with ordinary motion
2.2 Newton's second law
Core equation
F = ma
Concepts
Net force
Acceleration
Mass
Force diagrams
Proportional reasoning
Problems and applications
Shopping cart acceleration
Sled pulling
Loaded versus unloaded vehicles
Comparing different applied forces
Experiments and simulations
Experiment / simulation	Description
Cart-and-mass lab	Vary mass while holding force approximately constant
Force-versus-acceleration graph	Plot acceleration against net force
Sled simulator	Compare friction, mass, and pull force
Interactive force balance	Add forces and observe the net acceleration
2.3 Newton's third law
Concepts
Interaction pairs
Equal magnitude
Opposite direction
Different objects
Common misconception
Action-reaction forces do not cancel each other because they act on different objects.

Problems and applications
Walking
Swimming
Jumping from a boat
Recoil
Rocket propulsion
Pushing on a wall
Experiments and simulations
Experiment / simulation	Description
Two-skaters push-off	Model equal and opposite forces with unequal accelerations
Balloon rocket	Demonstrate reaction propulsion
Force-sensor pair	Compare forces between two interacting objects
Boat-jump model	Show why both person and boat move apart
2.4 Free-body diagrams
Concepts
Weight
Normal force
Tension
Friction
Applied force
Drag
Spring force
Problems and applications
Box on a table
Box on an inclined plane
Hanging mass
Connected blocks
Object pulled at an angle
Ladder against a wall
Experiments and simulations
Experiment / simulation	Description
Free-body-diagram builder	Drag and label forces on objects
Incline simulator	Change angle, mass, and friction
Connected-block system	Explore tension in ropes
Ladder-balance explorer	Change ladder angle, mass position, and wall friction
2.5 Friction
Concepts
Static friction
Kinetic friction
Coefficient of friction
Rolling resistance
Friction on slopes
Friction as both a helpful and resistive force
Problems and applications
Braking distance
Tires on wet roads
Walking
Climbing a slope
Dragging furniture
Vehicle acceleration
Experiments and simulations
Experiment / simulation	Description
Inclined-plane friction test	Find the angle at which an object begins to slide
Surface comparison	Compare friction across different materials
Braking-distance model	Compare speed, mass, surface, and stopping distance
Tire-traction simulation	Explore acceleration and turning limits
3. Work, Energy, and Power
Energy methods often solve a problem more directly than force-based methods.

3.1 Work and the work-energy theorem
Concepts
Positive work
Negative work
Zero work
Force-distance graphs
Net work
Kinetic energy
Core relationship
Net work = change in kinetic energy
Experiments and simulations
Experiment / simulation	Description
Force-distance graph explorer	Visualize work as area under a curve
Pulling-object lab	Compare work done over different distances
Friction-work simulation	Track mechanical energy converted to heat
Variable-force spring model	Compare constant and variable forces
3.2 Potential energy and conservation of energy
Concepts
Kinetic energy
Gravitational potential energy
Elastic potential energy
Conservative forces
Dissipative forces
Mechanical energy
Core relationship for ideal systems
Initial mechanical energy = final mechanical energy
Problems and applications
Ramps
Pendulums
Roller coasters
Skate parks
Springs
Braking distance
Experiments and simulations
Experiment / simulation	Description
Energy skate-park model	Track kinetic, potential, and thermal energy
Pendulum energy explorer	Show energy exchange throughout a swing
Spring-launch simulation	Explore spring stiffness, compression, and mass
Ramp-to-speed experiment	Compare predicted and measured speed at the bottom
3.3 Power and efficiency
Concepts
Energy versus power
Rate of energy transfer
Efficiency
Energy loss
Mechanical advantage
Problems and applications
Climbing stairs
Bicycle power
Motors
Cranes
Winches
Human exercise
Experiments and simulations
Experiment / simulation	Description
Stair-climbing power estimate	Estimate human power from height, mass, and time
Bicycle-power calculator	Compare speed, slope, and power
Machine-efficiency explorer	Add frictional losses to simple machines
Motor-lift model	Compare ideal and real lifting systems
4. Momentum, Impulse, and Collisions
4.1 Momentum
Core equation
p = mv
Concepts
Linear momentum
Direction
Conservation of momentum
Isolated systems
Center of mass
Experiments and simulations
Experiment / simulation	Description
Two-cart collision	Compare momentum before and after collision
Push-off experiment	Two people or carts move apart from rest
Center-of-mass visualizer	Track center-of-mass motion in multi-object systems
Recoil simulation	Explore conservation of momentum after separation
4.2 Impulse
Concepts
Force acting over time
Change in momentum
Force-time graphs
Collision duration
Safety systems
Applications
Airbags
Helmets
Catching a ball
Follow-through in sports
Packaging fragile equipment
Experiments and simulations
Experiment / simulation	Description
Force-time graph explorer	Compare short and long collision times
Egg-drop packaging model	Explore impact time and force conceptually
Ball-catching simulation	Compare rigid and soft catches
Airbag model	Show how increased stopping distance reduces force
4.3 Collisions
Concepts
Elastic collisions
Inelastic collisions
Perfectly inelastic collisions
Momentum conservation
Kinetic-energy loss
Problems and applications
Billiards
Bowling
Newton's cradle
Vehicle collisions
Recoil
Explosions
Experiments and simulations
Experiment / simulation	Description
Collision laboratory	Change mass, speed, and elasticity
Newton's-cradle model	Explore nearly elastic collisions
Billiard-ball simulation	Study two-dimensional momentum
Bowling-pin collision model	Introduce multi-object collision behavior
4.4 Ballistic pendulum
Why it is valuable
The ballistic pendulum combines two different solution methods:

Momentum conservation during the collision.
Energy conservation after the collision.
Experiments and simulations
Experiment / simulation	Description
Ballistic-pendulum calculator	Infer initial object speed from pendulum rise
Collision-plus-swing animation	Separate the inelastic collision and energy-conservation stages
Parameter explorer	Adjust masses and swing height
5. Constraints and Simple Machines
This section introduces mechanical advantage and the principle that ideal machines trade force for distance.

5.1 Mechanical advantage
Core idea
Input work = output work
for an ideal machine.

Concepts
Mechanical advantage
Velocity ratio
Efficiency
Force-distance tradeoff
“No free lunch” in ideal mechanics
Experiments and simulations
Experiment / simulation	Description
Mechanical-advantage explorer	Compare force and distance across machines
Ideal-versus-real machine	Add efficiency losses and friction
Work-conservation animation	Show equal input and output work in ideal systems
5.2 Levers
Concepts
Torque
Lever arm
Rotational equilibrium
First-class levers
Second-class levers
Third-class levers
Applications
Seesaws
Crowbars
Wheelbarrows
Pliers
Tweezers
Bottle openers
Human forearms
Experiments and simulations
Experiment / simulation	Description
Lever-balance simulator	Change force locations and load positions
Seesaw equilibrium experiment	Balance known masses at measured distances
Wrench-length comparison	Show why longer handles require less force
Human-arm torque model	Model muscle force and forearm leverage
5.3 Pulleys
Concepts
Fixed pulleys
Movable pulleys
Block and tackle
Tension
Rope-length constraints
Mechanical advantage
Key questions
How much force is needed to lift a load?
How far must the rope be pulled?
Why does a movable pulley reduce force but increase pulling distance?
Experiments and simulations
Experiment / simulation	Description
Pulley-system builder	Assemble fixed and movable pulley systems
Rope-length constraint explorer	Track how each rope segment changes length
Mechanical-advantage experiment	Compare predicted and measured lifting force
Atwood's machine simulator	Explore masses, pulley inertia, and acceleration
5.4 Inclined planes, wedges, screws, and wheel-and-axle systems
Concepts
Inclined planes
Friction
Wedges
Screws as wrapped inclined planes
Wheel-and-axle mechanical advantage
Experiments and simulations
Experiment / simulation	Description
Ramp-force calculator	Compare lifting directly with pushing up a ramp
Incline-angle experiment	Measure force needed at changing angles
Screw-mechanics visualizer	Unwrap a screw thread into an inclined plane
Wheel-and-axle simulation	Compare axle radius and wheel radius
5.5 Gears
Concepts
Gear ratio
Angular speed
Torque-speed tradeoff
Direction of rotation
Idler gears
Bicycle gears
Planetary gears
Experiments and simulations
Experiment / simulation	Description
Gear-train visualizer	Change tooth counts and see speed ratios
Bicycle-gear explorer	Compare cadence, wheel speed, and hill-climbing torque
Idler-gear puzzle	Show why an idler changes direction but not the total ratio
Planetary-gear model	Advanced simulation of sun, planet, and ring gears
6. Circular Motion and Gravitation
6.1 Uniform circular motion
Concepts
Angular speed
Tangential velocity
Centripetal acceleration
Centripetal force
Rotating reference frames
Common misconception
Centrifugal force is an apparent force used in a rotating frame. In an inertial frame, the required force is directed toward the center.

Experiments and simulations
Experiment / simulation	Description
Circular-motion explorer	Change radius, speed, and mass
Whirling-object model	Visualize tension in circular motion
Rotating-frame comparison	Compare inertial and rotating-frame descriptions
6.2 Banked curves and vertical circles
Concepts
Road banking
Friction limits in turns
Apparent weight
Loop-the-loop conditions
Minimum speed at the top of a loop
Experiments and simulations
Experiment / simulation	Description
Banked-curve calculator	Find the ideal banking angle for a speed
Loop-the-loop simulator	Explore speed, normal force, and track contact
Bucket-of-water model	Show why water stays in a rotating bucket
Roller-coaster loop animation	Track energy and apparent weight
6.3 Gravitation and orbits
Concepts
Newton's law of gravitation
Inverse-square law
Circular orbit
Elliptical orbit
Escape velocity
Kepler's laws
Continuous free fall
Experiments and simulations
Experiment / simulation	Description
Orbit simulator	Change initial velocity and observe orbit type
Inverse-square plot	Compare gravitational force at varying distances
Escape-velocity explorer	Compare launch speed to escape threshold
Kepler-law visualizer	Compare orbital period and orbital radius
7. Rotational Mechanics and Rolling
7.1 Angular kinematics
Linear quantity	Rotational quantity
Position	Angular position
Velocity	Angular velocity
Acceleration	Angular acceleration
Mass	Moment of inertia
Force	Torque
Concepts
Angular displacement
Angular velocity
Angular acceleration
Radius and tangential speed
Rotational analogues of linear equations
Experiments and simulations
Experiment / simulation	Description
Rotating-disk explorer	Relate radius, angular speed, and tangential speed
Fan-blade model	Compare points near and far from the axis
Angular-motion graph lab	Plot angular position, velocity, and acceleration
7.2 Torque and rotational equilibrium
Concepts
Turning effect of a force
Lever arms
Clockwise and counterclockwise torque
Static equilibrium
Balanced forces versus balanced torques
Experiments and simulations
Experiment / simulation	Description
Torque-balance simulator	Balance forces at different radii
Door-push experiment	Compare pushing near hinge versus handle
Ladder-equilibrium model	Explore normal force, friction, and torque
Wrench comparison	Compare required force for different handle lengths
7.3 Moment of inertia and rotational energy
Concepts
Mass distribution
Rotational inertia
Rotational kinetic energy
Why shape matters
Translation plus rotation
Experiments and simulations
Experiment / simulation	Description
Shape-and-inertia explorer	Compare hoops, disks, cylinders, and spheres
Rotating-chair simulation	Show changes in angular speed after mass moves inward
Flywheel model	Explore stored rotational energy
Rolling-race predictor	Predict which object reaches the bottom first
7.4 Rolling without slipping
Core relationship
v = rω
Concepts
Rolling condition
Static friction
Rotational energy
Translational energy
Rolling resistance
Applications
Bowling
Bicycle wheels
Yo-yos
Wheels and bearings
Objects rolling down ramps
Experiments and simulations
Experiment / simulation	Description
Rolling-race simulation	Compare hoop, disk, sphere, and cylinder
Ramp video analysis	Track rolling objects frame by frame
Yo-yo/spool model	Compare translational and rotational motion
Bowling-ball model	Explore speed, spin, and rolling state conceptually
7.5 Angular momentum and gyroscopes
Concepts
Angular momentum
Conservation of angular momentum
Gyroscopic precession
Rotational stability
Torque vectors
Experiments and simulations
Experiment / simulation	Description
Rotating-chair experiment	Pull masses inward while spinning
Bicycle-wheel demonstration	Observe reaction to changing wheel orientation
Gyroscope simulator	Visualize precession
Figure-skater model	Show faster rotation after reducing rotational inertia
8. Oscillations, Resonance, and Chaos
8.1 Simple harmonic motion
Concepts
Mass-spring systems
Pendulums at small angles
Amplitude
Phase
Frequency
Period
Restoring force
Experiments and simulations
Experiment / simulation	Description
Spring-mass simulator	Change mass, spring constant, and amplitude
Pendulum timer	Measure period at small angles
Phase-space plot	Plot velocity against position
Energy exchange animation	Track kinetic and potential energy
8.2 Damping and driven oscillations
Concepts
Damping
Underdamped motion
Critically damped motion
Overdamped motion
External driving force
Resonance
Phase difference
Applications
Car suspension
Shock absorbers
Door closers
Buildings
Musical instruments
Playground swings
Experiments and simulations
Experiment / simulation	Description
Damped-oscillator explorer	Adjust damping and observe motion
Resonance curve plotter	Sweep driving frequency and graph amplitude
Swing-pushing experiment	Compare pushing in phase and out of phase
Suspension model	Explore mass, damping, and spring stiffness
8.3 Coupled oscillators and nonlinear motion
Concepts
Coupled pendulums
Coupled springs
Beats
Normal modes
Energy transfer
Nonlinearity
Chaos
Sensitive dependence on initial conditions
Experiments and simulations
Experiment / simulation	Description
Coupled-pendulum simulation	Observe energy transfer between pendulums
Beats visualizer	Combine nearby frequencies
Double-pendulum simulator	Explore chaotic behavior
Initial-condition comparison	Start with almost identical conditions and compare outcomes
9. Counterintuitive Mechanics Problems
These should be among the most visually engaging parts of the repository.

Every page should begin with:

“What do you predict will happen?”

before revealing the result.

Double cone rolling uphill
The surprise
A double cone placed on diverging rails appears to roll uphill.

Resolution
Its center of mass actually moves downward as the rails spread apart.

Concepts
Center of mass
Potential energy
Geometry
Constraints
Suggested simulation
Allow users to adjust:

Rail angle
Rail divergence
Cone geometry
Initial position
Spool or yo-yo paradox
The surprise
Pulling a string wound around a spool can make the spool roll either toward the pulling force or away from it.

Concepts
Torque
Friction
String angle
Rotational motion
Suggested experiment
Use a spool, thread, and a gentle pulling force. Compare shallow and steep pulling angles.

Rolling race
The surprise
A hoop, disk, cylinder, and sphere released from the same height do not reach the bottom at the same time.

Concepts
Moment of inertia
Rotational kinetic energy
Rolling without slipping
Suggested experiment
Roll different shaped objects down the same ramp and record the motion in slow-motion video.

Falling slinky
The surprise
The bottom of a stretched slinky can remain almost motionless immediately after release.

Concepts
Tension
Internal forces
Compression waves
Wave-propagation speed
Suggested experiment
Record a falling slinky in slow motion and identify when the lower end begins to move.

Atwood's machine
The surprise
A simple two-mass pulley system becomes more subtle when pulley inertia, rope mass, or friction are included.

Concepts
Tension
Acceleration constraints
Newton's second law
Rotational inertia
Suggested simulation
Include toggles for:

Ideal massless pulley
Massive pulley
Rope mass
Bearing friction
Movable-pulley distance puzzle
The surprise
A load lifted by a movable pulley rises only part of the distance that the free end of the rope is pulled.

Concepts
Rope-length constraints
Mechanical advantage
Work conservation
Suggested simulation
Animate every rope segment and display:

Input distance
Output distance
Input force
Output force
Input work
Output work
Chain fountain
The surprise
A chain falling from a container can rise above the rim before descending.

Concepts
Momentum transfer
Tension
Contact forces
Model comparison
Suggested project approach
Present multiple levels:

Observational video
Simplified momentum explanation
More complete model discussion
Open questions and limitations
Brachistochrone curve
The question
What curve lets a bead travel between two points in the least time under gravity?

The surprise
The straight-line path is not the fastest path.

Result
The ideal curve is a cycloid.

Concepts
Energy conservation
Optimization
Calculus of variations
Parametric curves
Suggested simulation
Compare travel times along:

Straight line
Circular arc
Parabolic curve
Cycloid
Tautochrone curve
The surprise
A bead sliding on an inverted cycloid reaches the bottom in the same time from different starting positions.

Concepts
Cycloids
Isochronous motion
Oscillations
Suggested simulation
Release several beads from different points simultaneously and compare arrival times.

Catenary versus parabola
The surprise
A freely hanging uniform chain forms a catenary, not a parabola.

Concepts
Distributed load
Equilibrium
Hyperbolic cosine
Bridge design
Suggested experiment
Hang a chain, photograph it, and compare a fitted catenary with a fitted parabola.

Tennis-racket theorem
The surprise
Rotation about an object's intermediate principal axis is unstable, causing unexpected flipping.

Also known as
Intermediate-axis theorem
Dzhanibekov effect
Concepts
Rigid-body dynamics
Principal axes
Rotational stability
Angular momentum
Suggested simulation
Create a 3D rectangular-body simulation where users can choose the initial axis of rotation and observe stable versus unstable motion.

Gyroscopic precession
The surprise
A torque applied to a spinning wheel produces motion in a direction that may not match naive intuition.

Concepts
Angular momentum vectors
Torque
Precession
Rotational dynamics
Suggested experiment
Use a bicycle wheel suspended by one axle and observe its precession.

Bead on a rotating hoop
The surprise
As hoop rotation increases, the stable equilibrium position of a bead can split into new equilibrium positions.

Concepts
Effective potential
Stability
Bifurcation
Rotating reference frames
Suggested simulation
Plot the effective potential as a function of rotation rate and show equilibrium locations.

10. Real-World Capstone Simulations
These are larger multi-topic projects. They should be built incrementally rather than all at once.

Bowling physics
Build in stages
Rolling without slipping
Translational and rotational energy
Ball speed and spin
Friction between ball and lane
Simplified hook-path model
Ball-pin collisions
Multi-pin scatter simulation
Relevant concepts
Rolling motion
Friction
Moment of inertia
Momentum
Collisions
Energy loss
Bicycle mechanics
Build in stages
Gear ratio
Cadence and wheel speed
Torque at the rear wheel
Hill climbing
Power
Braking
Traction and cornering
Rolling resistance and aerodynamic drag
Relevant concepts
Gears
Torque
Power
Circular motion
Friction
Energy
Roller-coaster design
Build in stages
Energy conservation
Ramps and hills
Loops
Normal force and apparent weight
Frictional loss
Track curvature
Safety constraints
Relevant concepts
Energy
Circular motion
Normal force
Momentum
Damping
Bridge resonance
Build in stages
Mass-spring model
Natural frequency
Damping
Driven oscillation
Resonance
Coupled modes
Structural-design discussion
Relevant concepts
Oscillations
Resonance
Damping
Normal modes
Bow energy model
This should remain an educational model of elastic-energy transfer, not an instructional construction guide.

Build in stages
Spring-like force model
Elastic potential energy
Draw length
Projectile mass
Launch speed
Energy-transfer efficiency
Simplified projectile trajectory
Relevant concepts
Elastic energy
Work
Power
Efficiency
Projectile motion
Catapult motion model
This should focus on abstract mechanics and numerical modeling rather than constructing or optimizing physical devices.

Build in stages
Simple projectile motion
Specified launch speed and angle
Lever-arm geometry
Torque
Rotational inertia
Energy transfer
Release timing as an abstract parameter
Numerical integration
Relevant concepts
Projectile motion
Torque
Rotational energy
Moment of inertia
Numerical methods
Suggested First Release
Start small and polished rather than trying to build every topic immediately.

First ten pages
Motion graphs and constant acceleration
Projectile-motion explorer
Free-body diagrams and inclined planes
Friction and braking distance
Energy and roller-coaster ramps
Momentum and collisions
Levers and torque balance
Pulleys and mechanical advantage
Rolling race: hoop versus disk versus sphere
Double cone rolling uphill
Why this sequence works
It establishes the essential mechanics toolkit.
It includes practical applications early.
It introduces conservation laws before more difficult rotational problems.
It finishes with a memorable, visually surprising result.
It gives the project an immediate identity beyond a standard textbook.
Simulation Design Guidelines
Every interactive simulation should include:

A brief description of the problem
Clearly stated assumptions
A diagram or animation
Adjustable parameters
Reset and pause controls
Slow motion where appropriate
Numerical readouts
Graphs where useful
A prediction prompt
A comparison between ideal and realistic behavior when possible
Useful controls
Depending on the problem, include sliders for:

Mass
Length
Angle
Initial position
Initial velocity
Force
Coefficient of friction
Gravity
Spring constant
Damping coefficient
Gear teeth
Radius
Moment of inertia
Useful graphs
Position versus time
Velocity versus time
Acceleration versus time
Force versus time
Force versus displacement
Energy versus time
Momentum versus time
Phase space: velocity versus position
Angular position, velocity, and acceleration versus time
Preferred presentation pattern
Prediction
    ↓
Diagram and assumptions
    ↓
Mathematical model
    ↓
Interactive simulation
    ↓
Graphs and numerical evidence
    ↓
Explanation
    ↓
Real-world limitations
    ↓
Extension challenge
Technology Suggestions
Documentation and hosting
GitHub Pages
MkDocs
Material for MkDocs
Docusaurus
Jekyll
Astro
Next.js
Two-dimensional simulations
JavaScript and HTML Canvas
p5.js
Matter.js
Plotly
Three-dimensional simulations
Three.js
WebGL
Python-based 3D tools for offline notebooks
Mathematical and numerical tools
Python
NumPy
SciPy
Matplotlib
Jupyter
SymPy
References
Mechanics foundations
MIT OpenCourseWare — Classical Mechanics, Physics 8.01SC
OpenStax — University Physics, Volume 1
The Feynman Lectures on Physics, Volume I
HyperPhysics — Mechanics
Khan Academy — Classical Physics
Mathematical mechanics and advanced topics
MIT OpenCourseWare — Classical Mechanics III, Physics 8.09
Wolfram MathWorld — Brachistochrone Problem
Wolfram MathWorld — Tautochrone Problem
Wolfram MathWorld — Catenary
Wolfram MathWorld — Double Pendulum
Counterintuitive mechanics
The Tennis Racket Theorem
Brachistochrone — Encyclopaedia of Mathematics
Double Cone Demonstration — The Physics Classroom
The Chain Fountain — Veritasium
Project inspiration
Exploring Probability — GitHub repository
Exploring Probability — project page
License and Attribution
When using external content:

Check the original license.
Attribute diagrams, photos, videos, datasets, and source code.
Prefer public-domain, Creative Commons, or permissively licensed resources.
Keep a record of image and software attributions in references/.
Consider using:
MIT License for code
CC BY 4.0 for written documentation and original diagrams
Guiding Question for the Entire Repository
“What does the mathematics predict, what does intuition predict, and why are they sometimes different?”