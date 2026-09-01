// Content outline for every section page, keyed by folder name. Each
// subtopic becomes one tab. Edit here to flesh out real derivations,
// worked examples, and simulations later -- the page templates in
// render-section.js pick up any of: intro, core, surprise, misconception,
// stages, concepts, applications (+ applicationsLabel), experiments.
window.SECTIONS = {

"00-toolkit": {
  title: "0. Mathematical and Modeling Toolkit",
  intro: "This section establishes the language used throughout the repository.",
  subtopics: [
    {
      id: "units-and-dimensional-analysis",
      title: "Units and Dimensional Analysis",
      concepts: [
        "Length, time, mass, force, energy, power, momentum, and torque",
        "SI units", "Unit conversion", "Dimensional consistency", "Scaling laws",
        "Equations must have the same dimensions on both sides",
      ],
      experiments: [
        "Unit-conversion challenge — how to move reliably between units",
        "Dimensional-analysis checker — test whether an equation could be correct",
        "Scaling explorer — why larger objects don't simply behave like scaled-up smaller ones",
        "Human-scale measurements — estimate walking speed, stair-climbing power, or reaction time",
      ],
    },
    {
      id: "vectors-and-components",
      title: "Vectors and Components",
      concepts: [
        "Scalar versus vector quantities",
        "Position, displacement, velocity, acceleration, and force",
        "Vector addition and subtraction",
        "Components in two dimensions",
        "Dot products and cross products (advanced)",
      ],
      experiments: [
        "Vector addition playground — how vectors combine",
        "Force-component explorer — how an angled force splits into components",
        "Navigation challenge — relative displacement and direction",
        "Free-body-diagram builder — how to identify forces acting on an object",
      ],
    },
    {
      id: "coordinate-systems",
      title: "Coordinate Systems",
      concepts: [
        "Cartesian versus polar/cylindrical coordinates",
        "Choosing axes to simplify a problem",
        "Converting between coordinate systems",
        "Why polar coordinates simplify circular and orbital motion",
      ],
      experiments: [
        "Coordinate-choice explorer — same motion described in Cartesian and polar form",
        "Polar-plot demo — trace circular and spiral paths",
      ],
    },
    {
      id: "reference-frames",
      title: "Reference Frames",
      concepts: [
        "Inertial frames", "Relative motion", "Observers moving at different speeds",
        "Introductory non-inertial frames",
      ],
      experiments: [
        "Train-window simulation — relative velocity",
        "Boat-river crossing — velocity vectors",
        "Moving-walkway puzzle — frame-dependent descriptions",
        "Rotating-platform demo — why apparent forces arise in non-inertial frames",
      ],
    },
    {
      id: "free-body-diagrams",
      title: "Free-Body Diagrams",
      concepts: [
        "Isolating one body at a time",
        "Drawing conventions for force vectors",
        "Identifying every force acting on an object",
        "Common mistakes: forgetting the normal force, double-counting weight",
      ],
      experiments: [
        "Free-body-diagram builder — drag and label forces on objects",
        "Diagram-checker — compare a drawn diagram against the correct force set",
      ],
    },
  ],
},

"01-kinematics": {
  title: "1. Kinematics: Describing Motion",
  intro: "Kinematics describes how objects move without yet explaining why they move.",
  subtopics: [
    {
      id: "constant-velocity",
      title: "Constant Velocity",
      concepts: [
        "Position", "Displacement", "Distance", "Speed", "Velocity",
        "Position-time graphs", "Velocity-time graphs",
      ],
      applications: [
        "Catch-up problems", "Overtaking vehicles", "Walking on a moving walkway",
        "Aircraft travelling with or against wind", "Boats crossing a river",
      ],
      experiments: [
        "Motion graph lab — compare constant-speed motion to a position-time graph",
        "Two-runner challenge — find when a faster runner catches a slower one",
        "Relative-velocity explorer — change speed and direction of two moving objects",
        "Video analysis — track a toy car or walking person frame by frame",
      ],
    },
    {
      id: "constant-acceleration",
      title: "Constant Acceleration",
      core: "v = u + at &nbsp;&nbsp; s = ut + ½at² &nbsp;&nbsp; v² = u² + 2as",
      concepts: [
        "Constant acceleration", "Velocity-time graphs", "Area under a velocity-time graph",
        "Slope of a velocity-time graph", "Braking distance", "Reaction time",
      ],
      applications: [
        "Car braking distance", "Accelerating trains", "Elevator motion", "Sprinting",
        "Motion down a shallow ramp",
      ],
      experiments: [
        "Motion-graph explorer — change initial velocity and acceleration, observe graphs",
        "Ramp experiment — roll a cart down a ramp and estimate acceleration",
        "Braking-distance calculator — compare stopping distances at different speeds",
        "Elevator apparent-weight model — acceleration during lift start and stop",
      ],
    },
    {
      id: "free-fall",
      title: "Free Fall",
      concepts: [
        "Gravitational acceleration near Earth", "Free fall", "Upward throws",
        "Air resistance", "Terminal velocity",
        "Why mass doesn't affect ideal free-fall acceleration",
      ],
      applications: [
        "Dropping an object from a known height", "Throwing an object vertically upward",
        "Comparing a vacuum to air resistance", "Estimating reaction time using a falling ruler",
      ],
      experiments: [
        "Ruler-drop reaction-time test", "Drop comparison — compact vs. high-drag objects",
        "Free-fall graph simulation — position, velocity, acceleration vs. time",
        "Terminal-velocity model — ideal free fall vs. drag-based motion",
      ],
    },
    {
      id: "projectile-motion",
      title: "Projectile Motion",
      concepts: [
        "Horizontal and vertical components", "Horizontal launch", "Angled launch",
        "Range", "Maximum height", "Time of flight", "Launch angle",
        "Air resistance as an advanced extension",
      ],
      applications: [
        "Basketball arcs", "Soccer or football kicks", "Water fountains",
        "Ball clearing a wall", "Educational catapult-trajectory models",
      ],
      experiments: [
        "Projectile-motion explorer — adjust angle, speed, height, and gravity",
        "Target challenge — hit a target using physics constraints",
        "Water-stream experiment — photograph a water arc and fit a parabola",
        "Sports-video analysis — trace the path of a thrown or kicked ball",
      ],
    },
    {
      id: "relative-motion",
      title: "Relative Motion",
      concepts: [
        "Relative velocity between two moving objects",
        "Frame-dependent displacement", "Vector subtraction for relative motion",
      ],
      applications: [
        "Crossing a moving river", "Wind-affected flight paths", "Relative speed of passing vehicles",
      ],
      experiments: [
        "Boat-river crossing simulator", "Two-object relative-velocity explorer",
      ],
    },
  ],
},

"02-newtons-laws": {
  title: "2. Newton's Laws and Forces",
  intro: "This section explains why motion changes.",
  subtopics: [
    {
      id: "inertia",
      title: "Newton's First Law: Inertia",
      concepts: [
        "Net force", "Inertia", "Equilibrium", "Constant velocity",
        "Mass as resistance to acceleration",
      ],
      applications: [
        "Coin-and-card experiment", "Tablecloth pull",
        "Passengers lurching during vehicle braking", "Sliding objects on low-friction surfaces",
      ],
      applicationsLabel: "Demonstrations",
      experiments: [
        "Inertia prediction lab — predict object motion after a force stops",
        "Coin-and-card experiment — demonstrate inertia with household objects",
        "Vehicle braking simulation — passenger motion during deceleration",
        "Low-friction puck simulation — nearly force-free motion vs. ordinary motion",
      ],
    },
    {
      id: "newtons-second-law",
      title: "Newton's Second Law",
      core: "F = ma",
      concepts: ["Net force", "Acceleration", "Mass", "Force diagrams", "Proportional reasoning"],
      applications: [
        "Shopping cart acceleration", "Sled pulling", "Loaded versus unloaded vehicles",
        "Comparing different applied forces",
      ],
      experiments: [
        "Cart-and-mass lab — vary mass while holding force roughly constant",
        "Force-versus-acceleration graph", "Sled simulator — friction, mass, and pull force",
        "Interactive force balance — add forces and observe the net acceleration",
      ],
    },
    {
      id: "newtons-third-law",
      title: "Newton's Third Law",
      concepts: ["Interaction pairs", "Equal magnitude", "Opposite direction", "Different objects"],
      misconception: "Action-reaction forces do not cancel each other because they act on different objects.",
      applications: [
        "Walking", "Swimming", "Jumping from a boat", "Recoil", "Rocket propulsion", "Pushing on a wall",
      ],
      experiments: [
        "Two-skaters push-off — equal and opposite forces with unequal accelerations",
        "Balloon rocket — reaction propulsion", "Force-sensor pair — forces between two interacting objects",
        "Boat-jump model — why both person and boat move apart",
      ],
    },
    {
      id: "friction",
      title: "Friction",
      concepts: [
        "Static friction", "Kinetic friction", "Coefficient of friction", "Rolling resistance",
        "Friction on slopes", "Friction as both a helpful and resistive force",
      ],
      applications: [
        "Braking distance", "Tires on wet roads", "Walking", "Climbing a slope",
        "Dragging furniture", "Vehicle acceleration",
      ],
      experiments: [
        "Inclined-plane friction test — angle at which an object begins to slide",
        "Surface comparison — friction across different materials",
        "Braking-distance model — speed, mass, surface, and stopping distance",
        "Tire-traction simulation — acceleration and turning limits",
      ],
    },
    {
      id: "inclined-planes",
      title: "Inclined Planes",
      concepts: [
        "Decomposing gravity into components along and perpendicular to a slope",
        "Normal force on a slope", "Static vs. kinetic friction on an incline", "Critical sliding angle",
      ],
      applications: [
        "Box sliding down a ramp", "Box held stationary by friction",
        "Angle at which sliding begins", "Ladder leaning against a wall",
      ],
      experiments: [
        "Incline force-component explorer", "Critical-angle experiment",
        "Ladder-balance explorer — angle, mass position, and wall friction",
      ],
    },
    {
      id: "tension-and-connected-objects",
      title: "Tension and Connected Objects",
      concepts: [
        "Tension in ropes and strings", "Massless, inextensible rope assumption",
        "Systems of connected blocks", "Ropes passing over pulleys",
      ],
      applications: [
        "Two blocks connected by a string over a pulley", "Blocks connected on an incline",
        "Hanging mass problems", "Tug-of-war analysis",
      ],
      experiments: [
        "Connected-block system — explore tension in ropes",
        "Tension-meter demo — compare predicted and measured tension",
      ],
    },
  ],
},

"03-energy": {
  title: "3. Work, Energy, and Power",
  intro: "Energy methods often solve a problem more directly than force-based methods.",
  subtopics: [
    {
      id: "work",
      title: "Work and the Work-Energy Theorem",
      core: "Net work = change in kinetic energy",
      concepts: [
        "Positive work", "Negative work", "Zero work", "Force-distance graphs",
        "Net work", "Kinetic energy",
      ],
      experiments: [
        "Force-distance graph explorer — work as area under a curve",
        "Pulling-object lab — work done over different distances",
        "Friction-work simulation — mechanical energy converted to heat",
        "Variable-force spring model — constant vs. variable forces",
      ],
    },
    {
      id: "kinetic-energy",
      title: "Kinetic Energy",
      core: "KE = ½mv²",
      concepts: [
        "Kinetic energy and speed", "Kinetic energy and mass",
        "Relationship to the work-energy theorem", "Kinetic energy in collisions",
      ],
      experiments: [
        "Speed-vs-kinetic-energy plotter", "Kinetic-energy transfer demo in collisions",
      ],
    },
    {
      id: "potential-energy",
      title: "Potential Energy and Conservation of Energy",
      core: "Initial mechanical energy = final mechanical energy",
      concepts: [
        "Kinetic energy", "Gravitational potential energy", "Elastic potential energy",
        "Conservative forces", "Dissipative forces", "Mechanical energy",
      ],
      applications: ["Ramps", "Pendulums", "Roller coasters", "Skate parks", "Springs", "Braking distance"],
      experiments: [
        "Energy skate-park model — kinetic, potential, and thermal energy",
        "Pendulum energy explorer — energy exchange throughout a swing",
        "Spring-launch simulation — stiffness, compression, and mass",
        "Ramp-to-speed experiment — predicted vs. measured speed at the bottom",
      ],
    },
    {
      id: "conservation-of-energy",
      title: "Conservation of Energy",
      concepts: [
        "Isolated systems", "Energy transformation between forms",
        "Where 'lost' energy actually goes (heat, sound, deformation)",
      ],
      applications: ["Falling objects", "Pendulum swings", "Braking vehicles"],
      experiments: [
        "Energy-accounting tracker — tally kinetic, potential, and thermal energy over time",
      ],
    },
    {
      id: "power-and-efficiency",
      title: "Power and Efficiency",
      concepts: ["Energy versus power", "Rate of energy transfer", "Efficiency", "Energy loss", "Mechanical advantage"],
      applications: ["Climbing stairs", "Bicycle power", "Motors", "Cranes", "Winches", "Human exercise"],
      experiments: [
        "Stair-climbing power estimate — human power from height, mass, and time",
        "Bicycle-power calculator — speed, slope, and power",
        "Machine-efficiency explorer — add frictional losses to simple machines",
        "Motor-lift model — ideal vs. real lifting systems",
      ],
    },
    {
      id: "roller-coaster-physics",
      title: "Roller Coaster Physics",
      concepts: [
        "Energy conservation along a track", "Speed at the bottom vs. top of a hill",
        "Normal force and apparent weight through dips and crests",
      ],
      applications: ["Hill-to-hill energy transfer", "Minimum height to complete a loop"],
      experiments: ["Energy skate-park model", "Roller-coaster loop animation"],
    },
    {
      id: "full-ride-and-energy",
      title: "Full Ride and Energy Accounting",
      concepts: [
        "Continuous energy bookkeeping along an entire multi-hill track",
        "Kinetic, potential, and thermal energy tracked together as the car moves",
        "Where a real coaster can stall once friction is included",
      ],
      experiments: ["Full-ride energy simulation with adjustable friction"],
    },
  ],
},

"04-momentum": {
  title: "4. Momentum, Impulse, and Collisions",
  subtopics: [
    {
      id: "momentum",
      title: "Momentum",
      core: "p = mv",
      concepts: ["Linear momentum", "Direction", "Conservation of momentum", "Isolated systems", "Center of mass"],
      experiments: [
        "Two-cart collision — momentum before and after collision",
        "Push-off experiment — two people or carts move apart from rest",
        "Center-of-mass visualizer — track motion in multi-object systems",
        "Recoil simulation — conservation of momentum after separation",
      ],
    },
    {
      id: "impulse",
      title: "Impulse",
      concepts: ["Force acting over time", "Change in momentum", "Force-time graphs", "Collision duration", "Safety systems"],
      applications: ["Airbags", "Helmets", "Catching a ball", "Follow-through in sports", "Packaging fragile equipment"],
      experiments: [
        "Force-time graph explorer — compare short and long collision times",
        "Egg-drop packaging model — impact time and force conceptually",
        "Ball-catching simulation — rigid vs. soft catches",
        "Airbag model — increased stopping distance reduces force",
      ],
    },
    {
      id: "collisions",
      title: "Collisions",
      concepts: ["Elastic collisions", "Inelastic collisions", "Perfectly inelastic collisions", "Momentum conservation", "Kinetic-energy loss"],
      applications: ["Billiards", "Bowling", "Newton's cradle", "Vehicle collisions", "Recoil", "Explosions"],
      experiments: [
        "Collision laboratory — mass, speed, and elasticity",
        "Newton's-cradle model — nearly elastic collisions",
        "Billiard-ball simulation — two-dimensional momentum",
        "Bowling-pin collision model — multi-object collision behavior",
      ],
    },
    {
      id: "center-of-mass",
      title: "Center of Mass",
      concepts: [
        "Center of mass of a system of particles", "Center of mass motion under external forces",
        "Center of mass in explosions and collisions",
      ],
      applications: ["Multi-object systems", "Rocket stages separating", "Divers and gymnasts in the air"],
      experiments: ["Center-of-mass visualizer", "Two-body system explorer"],
    },
    {
      id: "ballistic-pendulum",
      title: "Ballistic Pendulum",
      intro: "Combines two different solution methods: momentum conservation during the collision, then energy conservation after it.",
      concepts: ["Momentum conservation during collision", "Energy conservation after collision", "Inferred initial speed"],
      experiments: [
        "Ballistic-pendulum calculator — infer initial speed from pendulum rise",
        "Collision-plus-swing animation — separate the two stages",
        "Parameter explorer — adjust masses and swing height",
      ],
    },
  ],
},

"05-simple-machines": {
  title: "5. Constraints and Simple Machines",
  intro: "This section introduces mechanical advantage and the principle that ideal machines trade force for distance.",
  subtopics: [
    {
      id: "mechanical-advantage",
      title: "Mechanical Advantage",
      core: "Input work = output work, for an ideal machine.",
      concepts: ["Mechanical advantage", "Velocity ratio", "Efficiency", "Force-distance tradeoff", '"No free lunch" in ideal mechanics'],
      experiments: [
        "Mechanical-advantage explorer — force and distance across machines",
        "Ideal-versus-real machine — add efficiency losses and friction",
        "Work-conservation animation — equal input and output work in ideal systems",
      ],
    },
    {
      id: "levers",
      title: "Levers",
      concepts: ["Torque", "Lever arm", "Rotational equilibrium", "First-class levers", "Second-class levers", "Third-class levers"],
      applications: ["Seesaws", "Crowbars", "Wheelbarrows", "Pliers", "Tweezers", "Bottle openers", "Human forearms"],
      experiments: [
        "Lever-balance simulator — force locations and load positions",
        "Seesaw equilibrium experiment — balance known masses at measured distances",
        "Wrench-length comparison — why longer handles need less force",
        "Human-arm torque model — muscle force and forearm leverage",
      ],
    },
    {
      id: "pulleys",
      title: "Pulleys",
      concepts: ["Fixed pulleys", "Movable pulleys", "Block and tackle", "Tension", "Rope-length constraints", "Mechanical advantage"],
      applications: [
        "How much force is needed to lift a load?", "How far must the rope be pulled?",
        "Why a movable pulley reduces force but increases pulling distance",
      ],
      applicationsLabel: "Key questions",
      experiments: [
        "Pulley-system builder — assemble fixed and movable pulley systems",
        "Rope-length constraint explorer — track how each rope segment changes length",
        "Mechanical-advantage experiment — predicted vs. measured lifting force",
        "Atwood's machine simulator — masses, pulley inertia, and acceleration",
      ],
    },
    {
      id: "inclined-planes-and-wedges",
      title: "Inclined Planes, Wedges, Screws, and Wheel-and-Axle",
      concepts: ["Inclined planes", "Friction", "Wedges", "Screws as wrapped inclined planes", "Wheel-and-axle mechanical advantage"],
      experiments: [
        "Ramp-force calculator — lifting directly vs. pushing up a ramp",
        "Incline-angle experiment — force needed at changing angles",
        "Screw-mechanics visualizer — unwrap a screw thread into an inclined plane",
        "Wheel-and-axle simulation — compare axle radius and wheel radius",
      ],
    },
    {
      id: "screws-and-wheel-axles",
      title: "Screws and Wheel-and-Axle Systems",
      concepts: ["Thread pitch and mechanical advantage", "Torque-to-force conversion", "Axle radius vs. wheel radius ratio"],
      applications: ["Jacks and clamps", "Steering wheels", "Doorknobs", "Winch handles"],
      experiments: ["Screw-mechanics visualizer", "Wheel-and-axle simulation"],
    },
    {
      id: "gears",
      title: "Gears",
      concepts: ["Gear ratio", "Angular speed", "Torque-speed tradeoff", "Direction of rotation", "Idler gears", "Bicycle gears", "Planetary gears"],
      experiments: [
        "Gear-train visualizer — tooth counts and speed ratios",
        "Bicycle-gear explorer — cadence, wheel speed, and hill-climbing torque",
        "Idler-gear puzzle — why an idler changes direction but not the total ratio",
        "Planetary-gear model — sun, planet, and ring gears",
      ],
    },
  ],
},

"06-circular-motion": {
  title: "6. Circular Motion and Gravitation",
  subtopics: [
    {
      id: "uniform-circular-motion",
      title: "Uniform Circular Motion",
      concepts: ["Angular speed", "Tangential velocity", "Centripetal acceleration", "Centripetal force", "Rotating reference frames"],
      misconception: "Centrifugal force is an apparent force used in a rotating frame. In an inertial frame, the required force is directed toward the center.",
      experiments: [
        "Circular-motion explorer — radius, speed, and mass",
        "Whirling-object model — visualize tension in circular motion",
        "Rotating-frame comparison — inertial vs. rotating-frame descriptions",
      ],
    },
    {
      id: "banked-curves",
      title: "Banked Curves",
      concepts: ["Road banking", "Friction limits in turns", "Ideal banking angle for a given speed"],
      experiments: ["Banked-curve calculator — ideal banking angle for a speed"],
    },
    {
      id: "vertical-circles",
      title: "Vertical Circles",
      concepts: ["Apparent weight", "Loop-the-loop conditions", "Minimum speed at the top of a loop"],
      experiments: [
        "Loop-the-loop simulator — speed, normal force, and track contact",
        "Bucket-of-water model — why water stays in a rotating bucket",
        "Roller-coaster loop animation — energy and apparent weight",
      ],
    },
    {
      id: "gravitation",
      title: "Gravitation",
      concepts: ["Newton's law of gravitation", "Inverse-square law", "Continuous free fall"],
      experiments: ["Inverse-square plot — gravitational force at varying distances"],
    },
    {
      id: "orbits",
      title: "Orbits",
      concepts: ["Circular orbit", "Elliptical orbit", "Escape velocity", "Kepler's laws"],
      experiments: [
        "Orbit simulator — change initial velocity and observe orbit type",
        "Escape-velocity explorer — launch speed vs. escape threshold",
        "Kepler-law visualizer — orbital period vs. orbital radius",
      ],
    },
  ],
},

"07-rotation-and-rolling": {
  title: "7. Rotational Mechanics and Rolling",
  subtopics: [
    {
      id: "angular-kinematics",
      title: "Angular Kinematics",
      concepts: [
        "Angular displacement", "Angular velocity", "Angular acceleration",
        "Radius and tangential speed", "Rotational analogues of linear equations",
        "Position → angular position, velocity → angular velocity, mass → moment of inertia, force → torque",
      ],
      experiments: [
        "Rotating-disk explorer — radius, angular speed, and tangential speed",
        "Fan-blade model — points near and far from the axis",
        "Angular-motion graph lab — angular position, velocity, and acceleration",
      ],
    },
    {
      id: "torque",
      title: "Torque",
      concepts: ["Turning effect of a force", "Lever arms", "Clockwise and counterclockwise torque", "Static equilibrium", "Balanced forces vs. balanced torques"],
      experiments: [
        "Torque-balance simulator — balance forces at different radii",
        "Door-push experiment — pushing near hinge vs. handle",
        "Ladder-equilibrium model — normal force, friction, and torque",
        "Wrench comparison — required force for different handle lengths",
      ],
    },
    {
      id: "moment-of-inertia",
      title: "Moment of Inertia",
      concepts: ["Mass distribution", "Rotational inertia", "Why shape matters"],
      experiments: [
        "Shape-and-inertia explorer — hoops, disks, cylinders, and spheres",
        "Rotating-chair simulation — angular speed change after mass moves inward",
      ],
    },
    {
      id: "rotational-energy",
      title: "Rotational Energy",
      concepts: ["Rotational kinetic energy", "Translation plus rotation", "Stored rotational energy"],
      experiments: ["Flywheel model — stored rotational energy", "Rolling-race predictor — which object reaches the bottom first"],
    },
    {
      id: "rolling-motion",
      title: "Rolling Without Slipping",
      core: "v = rω",
      concepts: ["Rolling condition", "Static friction", "Rotational energy", "Translational energy", "Rolling resistance"],
      applications: ["Bowling", "Bicycle wheels", "Yo-yos", "Wheels and bearings", "Objects rolling down ramps"],
      experiments: [
        "Rolling-race simulation — hoop, disk, sphere, and cylinder",
        "Ramp video analysis — track rolling objects frame by frame",
        "Yo-yo/spool model — translational vs. rotational motion",
        "Bowling-ball model — speed, spin, and rolling state conceptually",
      ],
    },
    {
      id: "angular-momentum",
      title: "Angular Momentum and Gyroscopes",
      concepts: ["Angular momentum", "Conservation of angular momentum", "Gyroscopic precession", "Rotational stability", "Torque vectors"],
      experiments: [
        "Rotating-chair experiment — pull masses inward while spinning",
        "Bicycle-wheel demonstration — reaction to changing wheel orientation",
        "Gyroscope simulator — visualize precession",
        "Figure-skater model — faster rotation after reducing rotational inertia",
      ],
    },
  ],
},

"08-oscillations": {
  title: "8. Oscillations, Resonance, and Chaos",
  subtopics: [
    {
      id: "simple-harmonic-motion",
      title: "Simple Harmonic Motion",
      concepts: ["Mass-spring systems", "Pendulums at small angles", "Amplitude", "Phase", "Frequency", "Period", "Restoring force"],
      experiments: [
        "Spring-mass simulator — mass, spring constant, and amplitude",
        "Pendulum timer — measure period at small angles",
        "Phase-space plot — velocity against position",
        "Energy exchange animation — kinetic and potential energy",
      ],
    },
    {
      id: "pendulums",
      title: "Pendulums",
      concepts: ["Small-angle approximation", "Period dependence on length and gravity", "Physical vs. simple pendulums"],
      experiments: ["Pendulum timer", "Pendulum energy explorer"],
    },
    {
      id: "damping",
      title: "Damping",
      concepts: ["Underdamped motion", "Critically damped motion", "Overdamped motion"],
      applications: ["Car suspension", "Shock absorbers", "Door closers"],
      experiments: ["Damped-oscillator explorer — adjust damping and observe motion", "Suspension model — mass, damping, and spring stiffness"],
    },
    {
      id: "driven-oscillations",
      title: "Driven Oscillations",
      concepts: ["External driving force", "Phase difference", "Steady-state response"],
      applications: ["Playground swings", "Musical instruments"],
      experiments: ["Swing-pushing experiment — pushing in phase and out of phase"],
    },
    {
      id: "resonance",
      title: "Resonance",
      concepts: ["Resonance", "Natural frequency", "Amplitude growth near resonance"],
      applications: ["Buildings", "Bridges", "Musical instruments"],
      experiments: ["Resonance curve plotter — sweep driving frequency and graph amplitude"],
    },
    {
      id: "coupled-oscillators",
      title: "Coupled Oscillators and Nonlinear Motion",
      concepts: ["Coupled pendulums", "Coupled springs", "Beats", "Normal modes", "Energy transfer", "Nonlinearity", "Chaos", "Sensitive dependence on initial conditions"],
      experiments: [
        "Coupled-pendulum simulation — energy transfer between pendulums",
        "Beats visualizer — combine nearby frequencies",
        "Double-pendulum simulator — explore chaotic behavior",
        "Initial-condition comparison — nearly identical starts, divergent outcomes",
      ],
    },
  ],
},

"09-unintuitive-problems": {
  title: "9. Counterintuitive Mechanics Problems",
  intro: 'These should be among the most visually engaging parts of the repository. Every page should begin with "What do you predict will happen?" before revealing the result.',
  subtopics: [
    {
      id: "double-cone-uphill",
      title: "Double Cone Rolling Uphill",
      surprise: "A double cone placed on diverging rails appears to roll uphill. Its center of mass actually moves downward as the rails spread apart.",
      concepts: ["Center of mass", "Potential energy", "Geometry", "Constraints"],
      experiments: ["Adjustable rail angle, rail divergence, cone geometry, and initial position"],
    },
    {
      id: "spool-paradox",
      title: "Spool / Yo-Yo Paradox",
      surprise: "Pulling a string wound around a spool can make the spool roll either toward the pulling force or away from it.",
      concepts: ["Torque", "Friction", "String angle", "Rotational motion"],
      experiments: ["Spool, thread, and a gentle pulling force; compare shallow and steep pulling angles"],
    },
    {
      id: "rolling-race",
      title: "Rolling Race",
      surprise: "A hoop, disk, cylinder, and sphere released from the same height do not reach the bottom at the same time.",
      concepts: ["Moment of inertia", "Rotational kinetic energy", "Rolling without slipping"],
      experiments: ["Roll different shaped objects down the same ramp and record in slow motion"],
    },
    {
      id: "falling-slinky",
      title: "Falling Slinky",
      surprise: "The bottom of a stretched slinky can remain almost motionless immediately after release.",
      concepts: ["Tension", "Internal forces", "Compression waves", "Wave-propagation speed"],
      experiments: ["Record a falling slinky in slow motion and identify when the lower end begins to move"],
    },
    {
      id: "pulley-distance-puzzle",
      title: "Movable-Pulley Distance Puzzle",
      surprise: "A load lifted by a movable pulley rises only part of the distance that the free end of the rope is pulled.",
      concepts: ["Rope-length constraints", "Mechanical advantage", "Work conservation"],
      experiments: ["Animate every rope segment; display input/output distance, force, and work"],
    },
    {
      id: "chain-fountain",
      title: "Chain Fountain",
      surprise: "A chain falling from a container can rise above the rim before descending.",
      concepts: ["Momentum transfer", "Tension", "Contact forces", "Model comparison"],
      experiments: ["Observational video, simplified momentum explanation, and a more complete model discussion"],
    },
    {
      id: "brachistochrone",
      title: "Brachistochrone Curve",
      surprise: "The straight-line path is not the fastest path between two points under gravity — the ideal curve is a cycloid.",
      concepts: ["Energy conservation", "Optimization", "Calculus of variations", "Parametric curves"],
      experiments: ["Compare travel times along a straight line, circular arc, parabola, and cycloid"],
    },
    {
      id: "tautochrone",
      title: "Tautochrone Curve",
      surprise: "A bead sliding on an inverted cycloid reaches the bottom in the same time regardless of starting position.",
      concepts: ["Cycloids", "Isochronous motion", "Oscillations"],
      experiments: ["Release several beads from different points simultaneously and compare arrival times"],
    },
    {
      id: "catenary",
      title: "Catenary vs. Parabola",
      surprise: "A freely hanging uniform chain forms a catenary, not a parabola.",
      concepts: ["Distributed load", "Equilibrium", "Hyperbolic cosine", "Bridge design"],
      experiments: ["Hang a chain, photograph it, and compare a fitted catenary with a fitted parabola"],
    },
    {
      id: "tennis-racket-theorem",
      title: "Tennis-Racket Theorem",
      surprise: "Rotation about an object's intermediate principal axis is unstable, causing unexpected flipping (the intermediate-axis theorem / Dzhanibekov effect).",
      concepts: ["Rigid-body dynamics", "Principal axes", "Rotational stability", "Angular momentum"],
      experiments: ["3D rectangular-body simulation with a selectable initial rotation axis"],
    },
    {
      id: "gyroscopic-precession",
      title: "Gyroscopic Precession",
      surprise: "A torque applied to a spinning wheel produces motion in a direction that may not match naive intuition.",
      concepts: ["Angular momentum vectors", "Torque", "Precession", "Rotational dynamics"],
      experiments: ["Bicycle wheel suspended by one axle, observing its precession"],
    },
    {
      id: "bead-on-rotating-hoop",
      title: "Bead on a Rotating Hoop",
      surprise: "As hoop rotation increases, the stable equilibrium position of a bead can split into new equilibrium positions.",
      concepts: ["Effective potential", "Stability", "Bifurcation", "Rotating reference frames"],
      experiments: ["Plot the effective potential vs. rotation rate and show equilibrium locations"],
    },
  ],
},

"10-capstones": {
  title: "10. Real-World Capstone Simulations",
  intro: "These are larger multi-topic projects. They should be built incrementally rather than all at once.",
  subtopics: [
    {
      id: "bowling-physics",
      title: "Bowling Physics",
      stages: [
        "Rolling without slipping", "Translational and rotational energy", "Ball speed and spin",
        "Friction between ball and lane", "Simplified hook-path model", "Ball-pin collisions", "Multi-pin scatter simulation",
      ],
      concepts: ["Rolling motion", "Friction", "Moment of inertia", "Momentum", "Collisions", "Energy loss"],
    },
    {
      id: "bicycle-mechanics",
      title: "Bicycle Mechanics",
      stages: [
        "Gear ratio", "Cadence and wheel speed", "Torque at the rear wheel", "Hill climbing",
        "Power", "Braking", "Traction and cornering", "Rolling resistance and aerodynamic drag",
      ],
      concepts: ["Gears", "Torque", "Power", "Circular motion", "Friction", "Energy"],
    },
    {
      id: "roller-coaster-design",
      title: "Roller-Coaster Design",
      stages: [
        "Energy conservation", "Ramps and hills", "Loops", "Normal force and apparent weight",
        "Frictional loss", "Track curvature", "Safety constraints",
      ],
      concepts: ["Energy", "Circular motion", "Normal force", "Momentum", "Damping"],
    },
    {
      id: "bridge-resonance",
      title: "Bridge Resonance",
      stages: [
        "Mass-spring model", "Natural frequency", "Damping", "Driven oscillation",
        "Resonance", "Coupled modes", "Structural-design discussion",
      ],
      concepts: ["Oscillations", "Resonance", "Damping", "Normal modes"],
    },
    {
      id: "bow-energy-model",
      title: "Bow Energy Model",
      intro: "This should remain an educational model of elastic-energy transfer, not an instructional construction guide.",
      stages: [
        "Spring-like force model", "Elastic potential energy", "Draw length", "Projectile mass",
        "Launch speed", "Energy-transfer efficiency", "Simplified projectile trajectory",
      ],
      concepts: ["Elastic energy", "Work", "Power", "Efficiency", "Projectile motion"],
    },
    {
      id: "catapult-motion-model",
      title: "Catapult Motion Model",
      intro: "This should focus on abstract mechanics and numerical modeling rather than constructing or optimizing physical devices.",
      stages: [
        "Simple projectile motion", "Specified launch speed and angle", "Lever-arm geometry", "Torque",
        "Rotational inertia", "Energy transfer", "Release timing as an abstract parameter", "Numerical integration",
      ],
      concepts: ["Projectile motion", "Torque", "Rotational energy", "Moment of inertia", "Numerical methods"],
    },
  ],
},

};
