/**
 * Presets - Balanced SoftwareType templates for Software Inc. Mod Studio
 */

const Presets = (function() {
  'use strict';

  function makeFeature(name, spec, desc, devTime, codeArt, submarkets, subFeatures = []) {
    return {
      Name: name,
      Spec: spec,
      Description: desc,
      DevTime: devTime,
      CodeArt: codeArt,
      Submarkets: submarkets,
      Optional: false,
      Features: subFeatures
    };
  }

  function makeSubFeature(name, desc, level, devTime, codeArt, submarkets) {
    return {
      Name: name,
      Description: desc,
      Level: level,
      DevTime: devTime,
      CodeArt: codeArt,
      Submarkets: submarkets,
      Scripts: {},
      RunType: 'Local'
    };
  }

  const presets = {
    game: {
      icon: '🎮',
      name: 'Video Game',
      description: 'A typical video game with high sales variance and short retention.',
      data: {
        Name: 'My Video Game',
        Description: 'An exciting new video game for entertainment.',
        Random: 0.5,
        OSSupport: 'True',
        Popularity: 0.6,
        Retention: 24,
        IdealPrice: 50,
        OptimalDevTime: 40,
        SubmarketNames: ['Gameplay', 'Graphics', 'Story'],
        Iterative: 0.75,
        NameGenerator: '',
        OneClient: false,
        InHouse: false,
        Unlock: 1990,
        Hardware: false,
        Categories: [],
        Features: [
          makeFeature('Graphics Engine', '3D', 'Core 3D rendering technology', 6, 1, [0, 3, 0], [
            makeSubFeature('Basic Shaders', 'Standard lighting and shading', 1, 4, 1, [0, 1, 0]),
            makeSubFeature('Advanced Lighting', 'Real-time global illumination', 2, 6, 1, [0, 2, 0])
          ]),
          makeFeature('Audio System', 'Audio', 'Sound and music playback', 4, 0.3, [1, 0, 1], [
            makeSubFeature('Spatial Audio', '3D positional sound', 1, 3, 0.2, [1, 0, 0]),
            makeSubFeature('Adaptive Music', 'Dynamic soundtrack system', 2, 5, 0.4, [0, 0, 1])
          ]),
          makeFeature('Gameplay Mechanics', 'System', 'Core game systems and logic', 8, 1, [3, 0, 1], [
            makeSubFeature('Physics Engine', 'Realistic physics simulation', 1, 5, 1, [1, 0, 0]),
            makeSubFeature('AI Behaviors', 'Smart enemy and NPC AI', 2, 6, 1, [2, 0, 0])
          ])
        ],
        AddOns: [],
        Manufacturing: null
      }
    },

    os: {
      icon: '🖥️',
      name: 'Operating System',
      description: 'A stable OS with low variance and long retention.',
      data: {
        Name: 'My Operating System',
        Description: 'A reliable operating system for computers.',
        Random: 0.0,
        OSSupport: 'False',
        Popularity: 1.0,
        Retention: 72,
        IdealPrice: 100,
        OptimalDevTime: 75,
        SubmarketNames: ['Stability', 'Compatibility', 'Speed'],
        Iterative: 0.25,
        NameGenerator: '',
        OneClient: false,
        InHouse: false,
        Unlock: 1980,
        Hardware: false,
        Categories: [],
        Features: [
          makeFeature('Kernel', 'System', 'Core operating system kernel', 10, 1, [3, 1, 1], [
            makeSubFeature('Memory Management', 'Efficient RAM handling', 1, 6, 1, [1, 0, 0]),
            makeSubFeature('Process Scheduler', 'Advanced CPU task scheduling', 2, 8, 1, [1, 0, 1])
          ]),
          makeFeature('File System', 'System', 'Data storage and retrieval', 6, 1, [1, 3, 0], [
            makeSubFeature('Journaling', 'Crash-safe file operations', 1, 4, 1, [1, 1, 0]),
            makeSubFeature('Compression', 'Built-in file compression', 2, 5, 1, [0, 1, 0])
          ]),
          makeFeature('User Interface', '2D', 'Desktop environment and shell', 8, 0.4, [1, 1, 2], [
            makeSubFeature('Window Manager', 'Smooth window handling', 1, 5, 0.3, [0, 0, 1]),
            makeSubFeature('Theme Engine', 'Customizable appearance', 2, 4, 0.5, [0, 0, 1])
          ])
        ],
        AddOns: [],
        Manufacturing: null
      }
    },

    tool_2d: {
      icon: '🎨',
      name: '2D Editor',
      description: 'A creative tool for 2D graphics and art.',
      data: {
        Name: 'My 2D Editor',
        Description: 'A powerful tool for creating 2D graphics and artwork.',
        Random: 0.3,
        OSSupport: 'True',
        Popularity: 0.5,
        Retention: 36,
        IdealPrice: 80,
        OptimalDevTime: 50,
        SubmarketNames: ['Features', 'Ease of Use', 'Performance'],
        Iterative: 0.4,
        NameGenerator: '',
        OneClient: false,
        InHouse: true,
        Unlock: 1990,
        Hardware: false,
        Categories: [],
        Features: [
          makeFeature('Drawing Engine', '2D', 'Core 2D rendering and canvas', 6, 0.3, [1, 1, 2], [
            makeSubFeature('Brush System', 'Advanced brush dynamics', 1, 4, 0.2, [1, 1, 0]),
            makeSubFeature('Vector Tools', 'Scalable vector graphics', 2, 5, 0.3, [1, 0, 0])
          ]),
          makeFeature('Layer System', 'System', 'Non-destructive editing layers', 5, 0.8, [2, 1, 1], [
            makeSubFeature('Blend Modes', 'Advanced layer blending', 1, 3, 0.7, [1, 0, 0]),
            makeSubFeature('Layer Effects', 'Drop shadows, glows, etc.', 2, 4, 0.6, [1, 0, 0])
          ]),
          makeFeature('Export System', 'System', 'File format export support', 4, 1, [1, 1, 1], [
            makeSubFeature('Batch Export', 'Export multiple files at once', 1, 3, 1, [1, 0, 0]),
            makeSubFeature('Cloud Export', 'Direct upload to cloud storage', 2, 4, 1, [0, 1, 0])
          ])
        ],
        AddOns: [],
        Manufacturing: null
      }
    },

    office: {
      icon: '🏢',
      name: 'Office Suite',
      description: 'Business productivity software.',
      data: {
        Name: 'My Office Suite',
        Description: 'A comprehensive suite of business productivity tools.',
        Random: 0.2,
        OSSupport: 'True',
        Popularity: 0.7,
        Retention: 48,
        IdealPrice: 120,
        OptimalDevTime: 60,
        SubmarketNames: ['Features', 'Compatibility', 'Price'],
        Iterative: 0.3,
        NameGenerator: '',
        OneClient: false,
        InHouse: false,
        Unlock: 1985,
        Hardware: false,
        Categories: [],
        Features: [
          makeFeature('Word Processor', 'System', 'Document creation and editing', 7, 0.7, [2, 1, 1], [
            makeSubFeature('Spell Check', 'Advanced grammar and spelling', 1, 3, 0.8, [1, 0, 0]),
            makeSubFeature('Templates', 'Professional document templates', 2, 4, 0.5, [1, 0, 0])
          ]),
          makeFeature('Spreadsheet', 'System', 'Data analysis and calculation', 8, 0.9, [2, 1, 1], [
            makeSubFeature('Formulas', 'Advanced mathematical functions', 1, 5, 1, [1, 0, 0]),
            makeSubFeature('Charts', 'Data visualization tools', 2, 4, 0.6, [1, 0, 0])
          ]),
          makeFeature('Presentation', '2D', 'Slide deck creation', 5, 0.4, [1, 1, 2], [
            makeSubFeature('Animations', 'Slide transitions and effects', 1, 3, 0.3, [0, 0, 1]),
            makeSubFeature('Themes', 'Professional design themes', 2, 3, 0.4, [0, 0, 1])
          ])
        ],
        AddOns: [],
        Manufacturing: null
      }
    },

    mobile: {
      icon: '📱',
      name: 'Mobile App',
      description: 'A mobile application with short dev cycles.',
      data: {
        Name: 'My Mobile App',
        Description: 'A sleek mobile application for smartphones.',
        Random: 0.4,
        OSSupport: 'Phone',
        Popularity: 0.5,
        Retention: 18,
        IdealPrice: 5,
        OptimalDevTime: 25,
        SubmarketNames: ['UX', 'Performance', 'Features'],
        Iterative: 0.6,
        NameGenerator: '',
        OneClient: false,
        InHouse: false,
        Unlock: 2007,
        Hardware: false,
        Categories: [],
        Features: [
          makeFeature('Touch Interface', '2D', 'Optimized touch controls', 4, 0.3, [2, 1, 1], [
            makeSubFeature('Gestures', 'Swipe, pinch, and tap gestures', 1, 3, 0.2, [1, 0, 0]),
            makeSubFeature('Haptics', 'Vibration feedback', 2, 2, 0.1, [1, 0, 0])
          ]),
          makeFeature('Backend Sync', 'Network', 'Cloud data synchronization', 5, 1, [1, 1, 2], [
            makeSubFeature('Offline Mode', 'Work without internet', 1, 4, 1, [1, 0, 1]),
            makeSubFeature('Real-time Sync', 'Instant data updates', 2, 5, 1, [0, 0, 1])
          ]),
          makeFeature('Push Notifications', 'Network', 'Alert and messaging system', 3, 0.8, [1, 0, 2], [
            makeSubFeature('Smart Alerts', 'AI-powered notification filtering', 1, 3, 0.9, [1, 0, 1]),
            makeSubFeature('Rich Media', 'Image and video notifications', 2, 2, 0.5, [0, 0, 1])
          ])
        ],
        AddOns: [],
        Manufacturing: null
      }
    },

    audio_tool: {
      icon: '🎵',
      name: 'Audio Tool',
      description: 'Professional audio editing and production software.',
      data: {
        Name: 'My Audio Tool',
        Description: 'Professional audio editing and music production software.',
        Random: 0.3,
        OSSupport: 'True',
        Popularity: 0.4,
        Retention: 36,
        IdealPrice: 150,
        OptimalDevTime: 45,
        SubmarketNames: ['Quality', 'Features', 'Ease'],
        Iterative: 0.35,
        NameGenerator: '',
        OneClient: false,
        InHouse: true,
        Unlock: 1992,
        Hardware: false,
        Categories: [],
        Features: [
          makeFeature('Audio Engine', 'Audio', 'Core audio processing pipeline', 7, 0.2, [2, 1, 1], [
            makeSubFeature('Multi-track', 'Unlimited track recording', 1, 5, 0.2, [1, 1, 0]),
            makeSubFeature('DSP Effects', 'Real-time audio effects', 2, 6, 0.3, [1, 1, 0])
          ]),
          makeFeature('MIDI Sequencer', 'Audio', 'MIDI composition and editing', 5, 0.4, [1, 2, 1], [
            makeSubFeature('Piano Roll', 'Visual MIDI editing', 1, 4, 0.3, [0, 1, 0]),
            makeSubFeature('Score Editor', 'Sheet music notation', 2, 5, 0.5, [0, 1, 0])
          ]),
          makeFeature('Mastering Suite', 'Audio', 'Final audio polish and export', 6, 0.2, [3, 0, 1], [
            makeSubFeature('Limiter', 'Peak limiting and loudness', 1, 4, 0.1, [1, 0, 0]),
            makeSubFeature('Dithering', 'High-quality bit reduction', 2, 3, 0.2, [1, 0, 0])
          ])
        ],
        AddOns: [],
        Manufacturing: null
      }
    },

    browser: {
      icon: '🕸️',
      name: 'Web Browser',
      description: 'Internet browsing software with high retention.',
      data: {
        Name: 'My Web Browser',
        Description: 'A fast and secure web browser for accessing the internet.',
        Random: 0.2,
        OSSupport: 'True',
        Popularity: 0.8,
        Retention: 60,
        IdealPrice: 0,
        OptimalDevTime: 55,
        SubmarketNames: ['Speed', 'Security', 'Features'],
        Iterative: 0.5,
        NameGenerator: '',
        OneClient: false,
        InHouse: false,
        Unlock: 1993,
        Hardware: false,
        Categories: [],
        Features: [
          makeFeature('Rendering Engine', 'System', 'HTML/CSS/JS rendering core', 8, 1, [1, 1, 2], [
            makeSubFeature('GPU Acceleration', 'Hardware-accelerated rendering', 1, 5, 1, [1, 0, 0]),
            makeSubFeature('WebGL Support', '3D graphics in browser', 2, 6, 1, [0, 0, 1])
          ]),
          makeFeature('Security', 'Network', 'Browser security features', 6, 0.8, [0, 3, 1], [
            makeSubFeature('Sandboxing', 'Process isolation', 1, 5, 0.9, [0, 1, 0]),
            makeSubFeature('Anti-tracking', 'Privacy protection', 2, 4, 0.7, [0, 1, 0])
          ]),
          makeFeature('Extensions', 'System', 'Plugin and extension system', 5, 0.9, [1, 0, 3], [
            makeSubFeature('API Framework', 'Extension development API', 1, 4, 1, [0, 0, 1]),
            makeSubFeature('Store', 'Extension marketplace', 2, 4, 0.8, [0, 0, 1])
          ])
        ],
        AddOns: [],
        Manufacturing: null
      }
    },

    console_hw: {
      icon: '🎮',
      name: 'Game Console (Hardware)',
      description: 'A physical gaming console with manufacturing.',
      data: {
        Name: 'My Game Console',
        Description: 'A powerful gaming console for the living room.',
        Random: 0.1,
        OSSupport: 'False',
        Popularity: 0.9,
        Retention: 84,
        IdealPrice: 400,
        OptimalDevTime: 90,
        SubmarketNames: ['Power', 'Price', 'Games'],
        Iterative: 0.6,
        NameGenerator: '',
        OneClient: false,
        InHouse: false,
        Unlock: 1985,
        Hardware: true,
        Categories: [],
        Features: [
          makeFeature('Graphics Chip', '3D', 'Custom GPU architecture', 10, 1, [2, 1, 1], [
            makeSubFeature('Ray Tracing', 'Real-time ray tracing', 2, 8, 1, [1, 0, 0]),
            makeSubFeature('Upscaling', 'AI-powered resolution upscaling', 3, 6, 1, [1, 0, 0])
          ]),
          makeFeature('Storage', 'System', 'Fast storage solution', 5, 1, [1, 1, 1], [
            makeSubFeature('SSD', 'Solid-state drive', 1, 3, 1, [0, 1, 0]),
            makeSubFeature('Cloud Storage', 'Online game saves', 2, 3, 1, [0, 0, 1])
          ]),
          makeFeature('Controller', 'System', 'Wireless game controller', 6, 0.3, [1, 1, 2], [
            makeSubFeature('Haptics', 'Advanced vibration feedback', 1, 3, 0.2, [1, 0, 0]),
            makeSubFeature('Motion Controls', 'Gyroscope and accelerometer', 2, 4, 0.4, [0, 0, 1])
          ])
        ],
        AddOns: [],
        Manufacturing: {
          Components: [
            { Name: 'GPU', BuiltInThumbnail: 'Microchip', Price: 150, Time: 8 },
            { Name: 'CPU', BuiltInThumbnail: 'Microchip', Price: 100, Time: 6 },
            { Name: 'SSD', BuiltInThumbnail: 'Harddrive', Price: 50, Time: 4 },
            { Name: 'Controller', BuiltInThumbnail: 'Joystick', Price: 40, Time: 4 },
            { Name: 'Case', BuiltInThumbnail: 'PlasticCase', Price: 30, Time: 4 },
            { Name: 'Console', BuiltInThumbnail: 'Console', Price: 80, Time: 6 }
          ],
          Processes: [
            { Inputs: ['GPU', 'CPU', 'SSD'], Output: 'Console' },
            { Inputs: ['Console', 'Controller', 'Case'], Output: 'Final' }
          ],
          FinalTime: 4
        }
      }
    }
  };

  function getPreset(id) {
    const preset = presets[id];
    if (!preset) return null;
    // Return a deep copy
    return JSON.parse(JSON.stringify(preset.data));
  }

  function getPresetList() {
    return Object.entries(presets).map(([id, p]) => ({
      id,
      icon: p.icon,
      name: p.name,
      description: p.description
    }));
  }

  function getConsoleCommands(modName, softwareName, category = 'Default') {
    return [
      { cmd: `RELOAD_MOD "${modName}"`, desc: 'Reload your mod in-game' },
      { cmd: `TEST_DEV_MOD "${modName}" "${softwareName}" ${category}`, desc: 'Check if players can reach 100% satisfaction' },
      { cmd: `CHECK_SPEC_REP "${modName}"`, desc: 'Verify all specialization levels are used' },
      { cmd: `INSTA_DEVELOP_DESIGN`, desc: 'Instantly release current design (modded only)' }
    ];
  }

  return {
    getPreset,
    getPresetList,
    getConsoleCommands
  };
})();

if (typeof window !== 'undefined') {
  window.Presets = Presets;
}
