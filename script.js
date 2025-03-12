// Global state variables
let chordGenerator;

// Global Tone.js constants
const drumset = new Tone.Players({
    kick: 'https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3',
    snare: 'https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3',
    hihat: 'https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3',
    tom1: 'https://tonejs.github.io/audio/drum-samples/CR78/tom1.mp3',
    tom2: 'https://tonejs.github.io/audio/drum-samples/CR78/tom2.mp3',
    tom3: 'https://tonejs.github.io/audio/drum-samples/CR78/tom3.mp3',
});

// As eighth notes
const drumPattern = {
    kick: [[1, 0, 0, 0], [.3, .1, 0, 0], [0, .8, .7, 0], [1, 0, 0, .2]].flat(),
    snare: [[0, 0, 0, 0], [.9, 0, 0, 0], [0, 0, 0, 0], [1, 0, .2, .5]].flat(),
    hihat: [[1, 1, .9, 1], [1, 0.9, 0.95, 1], [1, 1, 1, 1], [0.8, 1, 1, 1]].flat(),
    tom1: [[0, 0, 0, 0], [0, 0, .75, .9], [0, 0, 0, 0], [0.95, 0, 0, 0]].flat(),
    tom2: [[0, 0, 0.3, 0], [0, 0, 0, 0], [0.4, 0.5, 0, 0], [0, 0.95, 0, 0]].flat(),
    tom3: [[0, 0, 0, 0], [0, 0.3, 0, 0], [0, 0, 0, 0], [0, 0, 0.95, 0.2]].flat(),
}

const drumPatternTranspose = [];
for (i in [...Array(16).keys()]) {
    let obj = {};
    for (let [inst, seq] of Object.entries(drumPattern)) {
        obj[inst] = seq[i];
    }
    drumPatternTranspose.push(obj);
}

const drumVol = new Tone.Volume(-10);

const drumReverb = new Tone.Reverb(2, 0.1);
drumReverb.set({
    wet: 0.7,
})

const drumLowpass = new Tone.Filter(8000, "lowpass");

drumset.connect(drumVol);
drumVol.connect(drumReverb);
drumReverb.connect(drumLowpass);
drumLowpass.toDestination();

/* SYNTH */

const synth = new Tone.PolySynth();

const settings = {
    volume: -12,
    detune: 0,
    portamento: 0.01,
    envelope: {
        attack: 0.3,
        attackCurve: "sine",
        decay: 0.4,
        decayCurve: "exponential",
        release: 0.6,
        releaseCurve: "sine",
        sustain: 1
    },
    oscillator: {
        partialCount: 2,
        partials: [1, 2],
        phase: 2,
        type: "sine",
        count: 5,
        spread: 4,
    },
}

synth.set(settings);

const vol = new Tone.Volume(-12);

const delay = new Tone.Delay("8n", 0.5);

const reverb = new Tone.Reverb(5, 0.1);

const phaser = new Tone.Phaser({
	"frequency" : 0.2,
	"octaves" : 5,
	"baseFrequency" : 100
});

const lowpass = new Tone.Filter(4000, "lowpass");

const autoFilter = new Tone.AutoFilter({
    frequency: 0.3,
    type: 'sine',
    depth: 0.8,
    baseFrequency: 200,
    octaves: 5,
    filter: {
        type: 'lowpass',
        rolloff: -12,
        Q: 1
    }
}).start();

const channel = new Tone.Channel({channelCount: 2});

synth.connect(vol);
vol.connect(reverb);
reverb.connect(phaser);
phaser.connect(lowpass);
lowpass.connect(autoFilter);
autoFilter.connect(channel);
channel.toDestination();

const bass = new Tone.Synth();
bassReverb = new Tone.Reverb(2, 0.1);
bassReverb.set({
    wet: 0.5,
})

bass.connect(bassReverb)
bassReverb.toDestination();

Tone.Transport.bpm.value = 64;
new Tone.Loop(playSynth, '1n').start();
new Tone.Sequence(playDrum, drumPatternTranspose, '8n').start();

// Set up responsive buttons, chord generator
function initializeComponents() {
    chordGenerator = new ChordGenerator('C', 'I');

    const playButton = nn.get('.play-button .pointer');
    playButton.addEventListener('click', playButtonClick);

    const leftButton = nn.get('.left .button');
    const rightButton = nn.get('.right .button');

    leftButton.addEventListener('click', weirder);
    rightButton.addEventListener('click', normaler);
}

function playButtonClick() {
    triggerStartStop();

    const playButtonDiv = nn.get('.play-button');
    playButtonDiv.classList.toggle('active');
    
    const title = nn.get('.title h1')
    title.classList.remove('on-right-side');
    title.classList.remove('on-left-side');
}

function triggerStartStop() {
    if (Tone.Transport.state === 'stopped') {
        // console.log('started!');
        Tone.getTransport().start();
    } 
    else {
        // console.log('stopped!');
        Tone.getTransport().stop();
    }
}

function playSynth(time) {
    // console.log(time);
    // console.log(chordGenerator)
    // console.log('BN', chordGenerator.bassNote)
    // console.log('CNA', chordGenerator.chordNoteArray)
    bass.triggerAttackRelease(chordGenerator.bassNote, '1n', time)
    synth.triggerAttackRelease(chordGenerator.chordNoteArray, '1n', time);
    chordGenerator.setNextChord();
}

function playDrum(time, notes) {
    // console.log(time);
    // console.log(notes);
    rands = Object.keys(notes).map(() => Math.random());
    let i = 0;
    for (const inst in notes) {
        if (rands[i] < notes[inst]) {
            drumset.player(inst).start();
        }
        i++;
    }
}

function handleFishSide() {
    const fishDiv = nn.get('.fish');
    if (chordGenerator.level === 2) {
        fishDiv.classList.remove('on-left-side');
        fishDiv.classList.remove('on-right-side');
    }
    else if (chordGenerator.level < 2) {
        fishDiv.classList.add('on-left-side');
    }
    else {
        fishDiv.classList.add('on-right-side');
    }

    // now fish position
    const playButtonDiv = nn.get('.play-button');
    // console.log(chordGenerator.level);
    switch (chordGenerator.level) {
        case 0: 
            playButtonDiv.classList.remove('middle-left');
            playButtonDiv.classList.add('far-left');
            break;
        case 1: 
            playButtonDiv.classList.remove('far-left');
            playButtonDiv.classList.add('middle-left');
            break;
        case 2: 
            playButtonDiv.classList.remove('middle-left');
            playButtonDiv.classList.remove('middle-right');
            break;
        case 3: 
            playButtonDiv.classList.remove('far-right');
            playButtonDiv.classList.add('middle-right');
            break;
        case 4: 
            playButtonDiv.classList.remove('middle-right');
            playButtonDiv.classList.add('far-right');
            break;
    }
}

function weirder() {
    chordGenerator.weirder();
    // console.log('weirder!');
    // Edit the css for the title
    const title = nn.get('.title h1')
    title.classList.add('on-left-side');
    title.classList.remove('on-right-side');
    
    const playButtonDiv = nn.get('.play-button');
    playButtonDiv.classList.add('facing-left');
    playButtonDiv.classList.remove('facing-right');
    handleFishSide()
}

function normaler() {
    chordGenerator.normaler();
    // console.log('normaler!');
    const title = nn.get('.title h1');
    title.classList.remove('on-left-side');
    title.classList.add('on-right-side');

    const playButtonDiv = nn.get('.play-button');
    playButtonDiv.classList.add('facing-right');
    playButtonDiv.classList.remove('facing-left');
    handleFishSide()
}