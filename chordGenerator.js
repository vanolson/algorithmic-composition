// Code for generating the next chord
class ChordGenerator {
    // Some globals
    notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    major = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    minor = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
    diminished = ['vii'];
    dominant = ['V', 'II', 'III', 'VI', 'VII', 'bVII'];
    probabilityMapping = ChordGenerator.probabilityMapping();

    constructor(key = 'C', starterChord = 'I') {
        this.key = this.notes.includes(key) ? key : 'C';
        this.chordMapping = ChordGenerator.generateChordMapping();
        this.nextChord = this.chordMapping.hasOwnProperty(starterChord) ? starterChord : 'I';
        this.nextDrums;
        this.level = 2; // range is 0-4 (inclusive)
        this.probability;
        this.setProbability();
        this.bassNote;
        this.setBassNote();
        this.chordNoteArray;
        this.setChordNoteArray();
    }

    setNextChord() {
        const current = this.nextChord;
        const rand = Math.random();
        // console.log(rand)
        for (let [type, p] of Object.entries(this.probabilityMapping[this.level])) {
            if (rand <= p) {
                if (this.chordMapping.hasOwnProperty(current) && this.chordMapping[current].hasOwnProperty(type)) {
                    const chordOptions = this.chordMapping[current][type];
                    const index = Math.floor(Math.random() * chordOptions.length);
                    this.nextChord = chordOptions[index];
                }
                else {
                    // Prevent it from getting stuck if I forgot a case
                    this.nextChord = 'I';
                }
                break;
            }
        }

        // change key in certain cases
        if (this.nextChord === 'keyChange') {
            this.key = this.intervalNoteToLetterNote(
                'IV', this.intervalNoteToLetterNote(current, this.key)
            );
            this.nextChord = 'I';
        }

        this.setBassNote();
        this.setChordNoteArray();
    }

    setBassNote() {
        // Always in the second octave
        this.bassNote = `${this.intervalNoteToLetterNote(this.nextChord, this.key)}2`;
    }

    setChordNoteArray() {
        let noteNums;
        let seventh;
        let ninth;
        let justTheChord = this.nextChord;
        if (this.nextChord[0] == 'b') {
            justTheChord = this.nextChord.substring(1);
        }
        else if (this.nextChord[0] == '#') {
            justTheChord = this.nextChord.substring(1);
        }
        if (this.major.includes(justTheChord)) {
            noteNums = [0, 4, 7];
            if (this.dominant.includes(justTheChord)) {
                seventh = 10;
            }
            else {
                seventh = 11;
            }
            ninth = 2;
        }
        else if (this.minor.includes(justTheChord)) {
            noteNums = [0, 3, 7];
            seventh = 10;
            ninth = 2;
        }
        else if (this.diminished.includes(justTheChord)) {
            noteNums = [0, 3, 6];
            seventh = Math.random() < 0.5 ? 10 : 9;
            ninth = 2;
        }

        let chordNotes = this.noteNumbersToNoteArray(noteNums);

        // Use these notes in the 3rd-5th octaves
        this.chordNoteArray = chordNotes.map((n) => [`${n}3`, `${n}4`, `${n}5`]).flat()

        // Potentially add additives (7/9) on the 5th octave
        let additives = []
        if (Math.random() > this.probability.normal) {
            additives.push(seventh);
            // console.log(`added interval ${seventh}`);
        }
        if (Math.random() > this.probability.funky) {
            additives.push(ninth);
            // console.log(`added interval ${ninth}`);
        }
        let additiveNotes = this.noteNumbersToNoteArray(additives);
        this.chordNoteArray = this.chordNoteArray.concat(additiveNotes.map((n) => `${n}5`));
        // console.log("CNA", this.chordNoteArray);
    }

    setProbability() {
        this.probability = this.probabilityMapping[this.level];
    }

    weirder() {
        if (this.level > 0) {
            this.level -= 1;
        }
        this.setProbability();
    }

    normaler() {
        if (this.level < 4) {
            this.level += 1;
        }
        this.setProbability();
    }

    // Input should be zero-indexed (i.e. the I chord is 0, 4, 7)
    noteNumbersToNoteArray(noteNums) {
        const notes = this.notes;
        const noteIndex = notes.indexOf(this.intervalNoteToLetterNote(this.nextChord, this.key));
        // console.log(noteNums, notes.length, noteIndex);
        // console.log((noteIndex + noteNums[0]) % notes.length);

        return noteNums.map((n) => notes[(noteIndex + n) % notes.length])
    }

    intervalNoteToLetterNote(intervalNote, key) {
        // We're just gonna use sharps
        const notes = this.notes;

        let flatSharpDelta = 0;
        let justTheNote = intervalNote
        if (intervalNote[0] == 'b') {
            flatSharpDelta = -1;
            justTheNote = intervalNote.substring(1);
        }
        else if (intervalNote[0] == '#') {
            flatSharpDelta = 1;
            justTheNote = intervalNote.substring(1);
        }

        const rootNoteMapping = {
            'I': 0,
            'II': 2,
            'III': 4,
            'IV': 5,
            'V': 7,
            'VI': 9,
            'VII': 11,
        };

        const noteSemitones = rootNoteMapping[justTheNote.toUpperCase()] + flatSharpDelta;

        const index = (notes.indexOf(key) + noteSemitones) % notes.length;
        return notes[index];
    }

    static probabilityMapping() {
        function probObj(normal, funky, weird) {
            return {
                normal: normal,
                funky: funky,
                weird: weird,
            }
        }
        return {
            0: probObj(.20, .75, 1.00),
            1: probObj(.40, .83, 1.00),
            2: probObj(.60, .90, 1.00), // This is the default
            3: probObj(.75, .95, 1.00),
            4: probObj(.90, .98, 1.00),
        }
    }

    static generateChordMapping() {
        /* The data structure */
        const chordMapping = new Object();

        const chordList = [
            'I', 'i', 'ii', 'II', 'III', 'iii', 'iv', 'IV', 'V', 'VI', 'vi', 'VII', 'vii',
            'bii', 'bII', 'biii', 'bIII', 'bv', 'bV', 'bVI', 'bvi', 'bVII', 'bvii'
        ];
    
        /* Standard major scale */

        /* I CHORD */
        chordMapping['I'] = {
            normal: ['V', 'IV', 'vi', 'ii', 'iii'],
            funky: ['iv', 'vii', 'II', 'III', 'VI', 'VII'],
        };

        /* ii CHORD */
        chordMapping['ii'] = {
            normal: ['V', 'iii', 'IV', 'vi', 'I'],
            funky: ['II', 'III', 'vii']
        }

        /* iii CHORD */
        chordMapping['iii'] = {
            normal: ['vi', 'IV', 'I', 'ii', 'vii'],
            funky: ['vii', 'III', 'VI'],
        }

        /* IV CHORD */
        chordMapping['IV'] = {
            normal: ['I', 'V', 'vi'],
            funky: ['iv', 'III', 'vii'],
        }

        /* V CHORD */
        chordMapping['V'] = {
            normal: ['I', 'IV', 'vi', 'ii'],
            funky: ['VI', 'iv', 'VI', 'vii', 'III'],
        }

        /* vi CHORD */
        chordMapping['vi'] = {
            normal: ['I', 'IV'],
            funky: ['I', 'VI', 'vii'],
        }

        /* vii CHORD */
        chordMapping['vii'] = {
            normal: ['I'],
            funky: ['i', 'V', 'vi'],
        }

        /* Soft support for minor key */

        /* i CHORD */
        chordMapping['i'] = {
            normal: ['I', 'iv', 'V'],
            funky: ['v', 'bVI', 'bVII'],
        }

        /* bIII CHORD */
        chordMapping['bIII'] = {
            normal: ['i', 'iv', 'v', 'bVII', 'bVI'],
            funky: ['keyChange', 'bIII', 'V', 'bVII'],
        }

        /* iv CHORD */
        // This also is just a minor four leading to I
        chordMapping['iv'] = {
            normal: ['I', 'i'],
            funky: ['IV', 'V', 'vi', 'v', 'bVII'],
        }

        /* v CHORD */
        chordMapping['v'] = {
            normal: ['i', 'iv', 'bVII', 'bVI'],
            funky: ['bIII', 'V', 'bVII'],
        }

        /* bVI CHORD */
        chordMapping['bVI'] = {
            normal: ['i', 'v', 'V', 'bIII'],
            funky: ['keyChange', 'iv', 'bVII'],
        }

        /* bVII CHORD */
        chordMapping['bVII'] = {
            normal: ['i', 'V', 'v', 'bIII'],
            funky: ['keyChange', 'iv', 'bVI'],
        }


        /* Subdominants */

        /* II CHORD */
        chordMapping['II'] = {
            normal: ['V', 'ii'],
            funky: ['keyChange', 'III', 'I'],
        }

        /* III CHORD */
        chordMapping['III'] = {
            normal: ['vi', 'IV'],
            funky: ['keyChange'],
        }

        /* VI CHORD */
        chordMapping['VI'] = {
            normal: ['iii', 'V'],
            funky: ['keyChange'],
        }

        /* VI CHORD */
        chordMapping['VII'] = {
            normal: ['iii', 'III', 'V'],
            funky: ['keyChange'],
        }

        /* Flats */
        chordMapping['bii'] = {
            normal: ['I', 'biii'],
            funky: ['bvi', 'V'],
        }

        chordMapping['bII'] = {
            normal: ['I', 'bIII', 'V'],
            funky: ['keyChange'],
        }

        chordMapping['biii'] = {
            normal: ['I', 'v', 'ii', 'iv'],
            funky: ['bvi', 'V'],
        }

        chordMapping['bIII'] = {
            normal: ['I', 'bII', 'V'],
            funky: ['keyChange'],
        }

        chordMapping['bv'] = {
            normal: ['I', 'V', 'IV'],
            funky: ['bvi', 'v'],
        }

        chordMapping['bV'] = {
            normal: ['I', 'bVI', 'V'],
            funky: ['keyChange'],
        }

        chordMapping['bvi'] = {
            normal: ['I', 'bii', 'V'],
            funky: ['biii', 'bVI', 'vi'],
        }

        chordMapping['bvii'] = {
            normal: ['i', 'vii', 'I'],
            funky: ['biii', 'bII', 'bVI'],
        }

        const notIncluded = chordList.filter((c) => !Object.keys(chordMapping).includes(c));
        if (notIncluded.length > 0) {
            // console.log("Note to self: chords not included are", notIncluded);
        }

        // 'weird' chords are the ones not included in normal or funky
        for (let [chord, info] of Object.entries(chordMapping)) {
            info.weird = chordList.filter((c) => chord != c && !info.normal.includes(c) && !info.funky.includes(c))
        }

        // console.log(chordMapping)
        return chordMapping;
    }
    
}
