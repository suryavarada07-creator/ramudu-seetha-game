// =====================================================
// FIREBASE IMPORTS
// =====================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously
} from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    set,
    onValue,
    runTransaction
} from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";


// =====================================================
// FIREBASE CONFIGURATION
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDZyPH9FCpzXuylglWzVHFIzm10PUiG9ns",

    authDomain:
        "ramudu-seetha-game.firebaseapp.com",

    databaseURL:
        "https://ramudu-seetha-game-default-rtdb.asia-southeast1.firebasedatabase.app/",

    projectId:
        "ramudu-seetha-game",

    storageBucket:
        "ramudu-seetha-game.firebasestorage.app",

    messagingSenderId:
        "952717818740",

    appId:
        "1:952717818740:web:ea9df36aeab5687c1a4a21"
};


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getDatabase(app);


// =====================================================
// GAME DATA
// =====================================================

const teams = [
    "Agni",
    "Akash",
    "Vayu",
    "Prudhvi",
    "Jal"
];


const teamCodes = {

    Agni: "AGNI1",

    Akash: "AKASH",

    Vayu: "VAYU3",

    Prudhvi: "PRUDH",

    Jal: "JAL55"
};


const roles = [
    "Ramudu",
    "Seetha",
    "Lakshmana",
    "Ravana",
    "Sugriva"
];


const roleEmoji = {

    Ramudu: "🏹",

    Seetha: "🌸",

    Lakshmana: "⚔️",

    Ravana: "👹",

    Sugriva: "🦁"
};


// =====================================================
// VARIABLES
// =====================================================

let currentUser = null;

let selectedTeam = null;

let gameListenerStarted = false;


// =====================================================
// HTML ELEMENTS
// =====================================================

const homeScreen =
    document.getElementById("homeScreen");

const gameScreen =
    document.getElementById("gameScreen");

const teamSelect =
    document.getElementById("teamSelect");

const roomCodeInput =
    document.getElementById("roomCode");

const enterBtn =
    document.getElementById("enterBtn");

const loginMessage =
    document.getElementById("loginMessage");

const myTeam =
    document.getElementById("myTeam");

const ramuduPublic =
    document.getElementById("ramuduPublic");

const card =
    document.getElementById("card");

const openCardBtn =
    document.getElementById("openCardBtn");

const hideCardBtn =
    document.getElementById("hideCardBtn");

const cardMessage =
    document.getElementById("cardMessage");

const ramuduSection =
    document.getElementById("ramuduSection");

const seethaChoices =
    document.getElementById("seethaChoices");

const guessResult =
    document.getElementById("guessResult");

const resultSection =
    document.getElementById("resultSection");

const resultText =
    document.getElementById("resultText");


// =====================================================
// CREATE NEW GAME DATA
// =====================================================

function makeFreshGame() {

    const shuffledRoles =
        [...roles].sort(
            () => Math.random() - 0.5
        );


    const teamData = {};


    teams.forEach(
        (team, index) => {

            teamData[team] = {

                role:
                    shuffledRoles[index],

                cardOpen:
                    false
            };
        }
    );


    return {

        roundId:
            Date.now().toString() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 8),

        teams:
            teamData,

        guessMade:
            false,

        guessedTeam:
            "",

        guessCorrect:
            false,

        gameFinished:
            false
    };
}


// =====================================================
// FIREBASE LOGIN
// =====================================================

async function loginUser() {

    try {

        loginMessage.textContent =
            "Connecting to Firebase...";


        const result =
            await signInAnonymously(auth);


        currentUser =
            result.user;


        console.log(
            "Firebase login successful:",
            currentUser.uid
        );


        loginMessage.textContent =
            "Firebase connected ✅";


        enterBtn.disabled = false;

    } catch (error) {

        console.error(
            "Firebase login failed:",
            error
        );


        loginMessage.textContent =
            "Firebase connection failed ❌";


        alert(
            "Firebase connection failed:\n\n" +
            error.message
        );
    }
}


// =====================================================
// ENTER GAME
// =====================================================

async function enterGame() {

    const team =
        teamSelect.value;


    const code =
        roomCodeInput.value
            .trim()
            .toUpperCase();


    if (!team) {

        alert(
            "Please select your team."
        );

        return;
    }


    if (!code) {

        alert(
            "Please enter your team code."
        );

        return;
    }


    if (
        code !==
        teamCodes[team]
    ) {

        alert(
            "Wrong team code!"
        );

        return;
    }


    if (!currentUser) {

        alert(
            "Firebase is still connecting. Please wait."
        );

        return;
    }


    enterBtn.disabled = true;


    try {

        selectedTeam =
            team;


        await createGameIfNeeded();


        homeScreen.classList.add(
            "hidden"
        );


        gameScreen.classList.remove(
            "hidden"
        );


        myTeam.textContent =
            selectedTeam;


        listenToGame();

    } catch (error) {

        console.error(
            "ENTER GAME ERROR:",
            error
        );


        alert(
            "Could not enter game:\n\n" +
            error.message
        );


        enterBtn.disabled = false;
    }
}


// =====================================================
// CREATE GAME IF NONE EXISTS
// =====================================================

async function createGameIfNeeded() {

    const gameRef = ref(db, "fixedGame");

    const snapshot = await get(gameRef);

    // -----------------------------------------
    // IF NO GAME EXISTS → CREATE NEW GAME
    // -----------------------------------------

    if (!snapshot.exists()) {

        console.log("No game found. Creating new game...");

        await set(
            gameRef,
            makeFreshGame()
        );

        console.log("Fresh game created.");

        return;
    }

    const game = snapshot.val();

    // -----------------------------------------
    // IF OLD GAME IS ALREADY FINISHED
    // → CREATE A COMPLETELY NEW GAME
    // -----------------------------------------

    if (game.gameFinished === true) {

        console.log(
            "Old game finished. Creating fresh game..."
        );

        await set(
            gameRef,
            makeFreshGame()
        );

        console.log(
            "Fresh game created successfully."
        );

        return;
    }

    // -----------------------------------------
    // GAME IS STILL ACTIVE
    // → KEEP IT
    // -----------------------------------------

    console.log(
        "Active game already exists."
    );
}

// =====================================================
// START COMPLETELY NEW GAME
// ONLY RAMUDU CAN DO THIS
// =====================================================

async function startNewGame() {

    if (!selectedTeam) {

        return;
    }


    const gameRef =
        ref(
            db,
            "fixedGame"
        );


    try {

        const result =
            await runTransaction(
                gameRef,
                game => {

                    if (!game) {

                        return;
                    }


                    // ---------------------------------
                    // ONLY RAMUDU CAN START NEW GAME
                    // ---------------------------------

                    if (
                        !game.teams ||
                        !game.teams[selectedTeam] ||
                        game.teams[selectedTeam].role !==
                        "Ramudu"
                    ) {

                        console.log(
                            "Only Ramudu can start a new game."
                        );

                        return;
                    }


                    // ---------------------------------
                    // OLD GAME MUST BE FINISHED
                    // ---------------------------------

                    if (
                        game.gameFinished !== true
                    ) {

                        console.log(
                            "Current game is not finished."
                        );

                        return;
                    }


                    // ---------------------------------
                    // CREATE FRESH GAME
                    // ---------------------------------

                    return makeFreshGame();
                }
            );


        if (result.committed) {

            alert(
                "New game started successfully! 🎮"
            );

        } else {

            alert(
                "New game could not be started."
            );
        }

    } catch (error) {

        console.error(
            "NEW GAME ERROR:",
            error
        );


        alert(
            "Could not start new game:\n\n" +
            error.message
        );
    }
}


// =====================================================
// LISTEN TO GAME
// =====================================================

function listenToGame() {

    if (gameListenerStarted) {

        return;
    }


    gameListenerStarted = true;


    const gameRef =
        ref(
            db,
            "fixedGame"
        );


    onValue(
        gameRef,
        snapshot => {

            if (
                !snapshot.exists()
            ) {

                return;
            }


            const game =
                snapshot.val();


            if (
                !game.teams
            ) {

                return;
            }


            updateMyCard(game);

            updateRamudu(game);

            updateRamuduControls(game);

            updateResult(game);
        }
    );
}


// =====================================================
// UPDATE MY CARD
// =====================================================

function updateMyCard(game) {

    if (!selectedTeam) {

        return;
    }


    const teamData =
        game.teams[selectedTeam];


    if (!teamData) {

        return;
    }


    if (
        teamData.cardOpen === true
    ) {

        card.classList.add(
            "opened"
        );


        card.innerHTML = `

            <div class="card-front">

                <div class="role-emoji">
                    ${roleEmoji[teamData.role]}
                </div>

                <div class="role-name">
                    ${teamData.role}
                </div>

            </div>

        `;


        openCardBtn.classList.add(
            "hidden"
        );


        hideCardBtn.classList.remove(
            "hidden"
        );


        cardMessage.textContent =
            "Your card is visible.";

    } else {

        card.classList.remove(
            "opened"
        );


        card.innerHTML = `

            <div class="card-back">

                🎴

                <span>
                    Your Card
                </span>

            </div>

        `;


        openCardBtn.classList.remove(
            "hidden"
        );


        hideCardBtn.classList.add(
            "hidden"
        );


        cardMessage.textContent =
            "Your card is hidden.";
    }
}


// =====================================================
// OPEN MY CARD
// =====================================================

async function openMyCard() {

    if (!selectedTeam) {

        return;
    }


    const teamRef =
        ref(
            db,
            `fixedGame/teams/${selectedTeam}`
        );


    try {

        await runTransaction(
            teamRef,
            data => {

                if (!data) {

                    return;
                }


                return {

                    ...data,

                    cardOpen:
                        true
                };
            }
        );

    } catch (error) {

        console.error(
            error
        );


        alert(
            "Could not open card."
        );
    }
}


// =====================================================
// HIDE MY CARD
// =====================================================

async function hideMyCard() {

    if (!selectedTeam) {

        return;
    }


    const teamRef =
        ref(
            db,
            `fixedGame/teams/${selectedTeam}`
        );


    try {

        await runTransaction(
            teamRef,
            data => {

                if (!data) {

                    return;
                }


                return {

                    ...data,

                    cardOpen:
                        false
                };
            }
        );

    } catch (error) {

        console.error(
            error
        );


        alert(
            "Could not hide card."
        );
    }
}


// =====================================================
// FIND RAMUDU
// =====================================================

function findRamudu(game) {

    let ramuduTeam =
        null;


    teams.forEach(
        team => {

            if (
                game.teams[team] &&
                game.teams[team].role ===
                "Ramudu"
            ) {

                ramuduTeam =
                    team;
            }
        }
    );


    return ramuduTeam;
}


// =====================================================
// SHOW RAMUDU PUBLICLY
// =====================================================

function updateRamudu(game) {

    const ramuduTeam =
        findRamudu(game);


    if (ramuduTeam) {

        ramuduPublic.textContent =
            `🏹 ${ramuduTeam} is Ramudu`;
    }
}


// =====================================================
// RAMUDU CONTROLS
// =====================================================

function updateRamuduControls(game) {

    if (!selectedTeam) {

        return;
    }


    const myData =
        game.teams[selectedTeam];


    if (!myData) {

        return;
    }


    // -----------------------------------------
    // ONLY RAMUDU
    // -----------------------------------------

    if (
        myData.role !==
        "Ramudu"
    ) {

        ramuduSection.classList.add(
            "hidden"
        );

        return;
    }


    ramuduSection.classList.remove(
        "hidden"
    );


    // -----------------------------------------
    // GAME FINISHED
    // -----------------------------------------

    if (
        game.gameFinished === true
    ) {

        seethaChoices.innerHTML = "";


        const finishedMessage =
            document.createElement(
                "p"
            );


        finishedMessage.textContent =
            "🎮 This round is finished.";


        seethaChoices.appendChild(
            finishedMessage
        );


        // -------------------------------------
        // NEW GAME BUTTON
        // -------------------------------------

        let newGameButton =
            document.getElementById(
                "newGameButton"
            );


        if (!newGameButton) {

            newGameButton =
                document.createElement(
                    "button"
                );


            newGameButton.id =
                "newGameButton";


            newGameButton.textContent =
                "🎮 Start New Game";


            newGameButton.addEventListener(
                "click",
                startNewGame
            );


            seethaChoices.appendChild(
                newGameButton
            );
        }


        return;
    }


    // -----------------------------------------
    // GUESS ALREADY MADE
    // -----------------------------------------

    if (
        game.guessMade === true
    ) {

        seethaChoices.innerHTML =
            "<p>🔒 Selection already made.</p>";

        return;
    }


    // -----------------------------------------
    // SHOW TEAM BUTTONS
    // -----------------------------------------

    seethaChoices.innerHTML = "";


    teams.forEach(
        team => {

            if (
                team === selectedTeam
            ) {

                return;
            }


            const button =
                document.createElement(
                    "button"
                );


            button.textContent =
                `🌸 ${team}`;


            button.addEventListener(
                "click",
                () => {

                    selectSeetha(team);
                }
            );


            seethaChoices.appendChild(
                button
            );
        }
    );
}


// =====================================================
// SELECT SEETHA
// =====================================================

async function selectSeetha(
    selectedTeamName
) {

    if (!selectedTeam) {

        return;
    }


    const gameRef =
        ref(
            db,
            "fixedGame"
        );


    try {

        const result =
            await runTransaction(
                gameRef,
                game => {

                    if (!game) {

                        return;
                    }


                    // ---------------------------------
                    // GAME MUST NOT BE FINISHED
                    // ---------------------------------

                    if (
                        game.gameFinished === true
                    ) {

                        return;
                    }


                    // ---------------------------------
                    // ONLY ONE GUESS
                    // ---------------------------------

                    if (
                        game.guessMade === true
                    ) {

                        return;
                    }


                    // ---------------------------------
                    // CHECK RAMUDU
                    // ---------------------------------

                    if (
                        !game.teams ||
                        !game.teams[selectedTeam] ||
                        game.teams[selectedTeam].role !==
                        "Ramudu"
                    ) {

                        console.log(
                            "Only Ramudu can select Seetha."
                        );

                        return;
                    }


                    // ---------------------------------
                    // FIND ACTUAL SEETHA
                    // ---------------------------------

                    let actualSeetha =
                        null;


                    teams.forEach(
                        team => {

                            if (
                                game.teams[team] &&
                                game.teams[team].role ===
                                "Seetha"
                            ) {

                                actualSeetha =
                                    team;
                            }
                        }
                    );


                    if (!actualSeetha) {

                        return;
                    }


                    // ---------------------------------
                    // CHECK ANSWER
                    // ---------------------------------

                    const correct =
                        selectedTeamName ===
                        actualSeetha;


                    // ---------------------------------
                    // SAVE RESULT
                    // ---------------------------------

                    return {

                        ...game,

                        guessMade:
                            true,

                        guessedTeam:
                            selectedTeamName,

                        guessCorrect:
                            correct,

                        gameFinished:
                            true
                    };
                }
            );


        if (
            result.committed
        ) {

            console.log(
                "Seetha selection saved."
            );

        } else {

            console.log(
                "Selection was not committed."
            );
        }

    } catch (error) {

        console.error(
            "SEETHA SELECTION ERROR:",
            error
        );


        alert(
            "Could not select Seetha."
        );
    }
}


// =====================================================
// SHOW RESULT
// =====================================================

function updateResult(game) {

    // -----------------------------------------
    // NO RESULT BEFORE GUESS
    // -----------------------------------------

    if (
        game.guessMade !== true
    ) {

        resultSection.classList.add(
            "hidden"
        );


        guessResult.textContent =
            "";


        resultText.innerHTML =
            "";


        return;
    }


    // -----------------------------------------
    // SHOW RESULT
    // -----------------------------------------

    resultSection.classList.remove(
        "hidden"
    );


    let actualSeetha =
        null;


    teams.forEach(
        team => {

            if (
                game.teams[team] &&
                game.teams[team].role ===
                "Seetha"
            ) {

                actualSeetha =
                    team;
            }
        }
    );


    // -----------------------------------------
    // CORRECT
    // -----------------------------------------

    if (
        game.guessCorrect === true
    ) {

        resultText.innerHTML = `

            <strong>
                ✅ RIGHT!
            </strong>

            <br><br>

            ${game.guessedTeam}
            is Seetha! 🌸

        `;


        guessResult.textContent =
            "✅ Right!";

    } else {

        // -----------------------------------------
        // WRONG
        // -----------------------------------------

        resultText.innerHTML = `

            <strong>
                ❌ WRONG!
            </strong>

            <br><br>

            ${game.guessedTeam}
            is not Seetha.

            <br><br>

            🌸
            ${actualSeetha}
            is Seetha.

        `;


        guessResult.textContent =
            "❌ Wrong!";
    }
}


// =====================================================
// BUTTON EVENTS
// =====================================================

enterBtn.addEventListener(
    "click",
    enterGame
);


openCardBtn.addEventListener(
    "click",
    openMyCard
);


hideCardBtn.addEventListener(
    "click",
    hideMyCard
);


// =====================================================
// START FIREBASE LOGIN
// =====================================================

enterBtn.disabled = true;

loginUser();