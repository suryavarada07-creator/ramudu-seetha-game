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
// TEAMS
// =====================================================

const teams = [
    "Agni",
    "Akash",
    "Vayu",
    "Prudhvi",
    "Jal"
];


// =====================================================
// TEAM CODES
// =====================================================

const teamCodes = {

    Agni: "AGNI1",

    Akash: "AKASH",

    Vayu: "VAYU3",

    Prudhvi: "PRUDH",

    Jal: "JAL55"
};


// =====================================================
// ROLES
// =====================================================

const roles = [
    "Ramudu",
    "Seetha",
    "Lakshmana",
    "Ravana",
    "Sugriva"
];


// =====================================================
// ROLE EMOJIS
// =====================================================

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


    // -----------------------------
    // CHECK TEAM
    // -----------------------------

    if (!team) {

        alert(
            "Please select your team."
        );

        return;
    }


    // -----------------------------
    // CHECK CODE
    // -----------------------------

    if (!code) {

        alert(
            "Please enter your team code."
        );

        return;
    }


    // -----------------------------
    // CHECK TEAM CODE
    // -----------------------------

    if (
        code !==
        teamCodes[team]
    ) {

        alert(
            "Wrong team code!"
        );

        return;
    }


    // -----------------------------
    // CHECK FIREBASE
    // -----------------------------

    if (!currentUser) {

        alert(
            "Firebase is still connecting. Please wait."
        );

        return;
    }


    enterBtn.disabled = true;

    loginMessage.textContent =
        "Entering game...";


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
// CREATE GAME
// =====================================================

async function createGameIfNeeded() {

    const gameRef =
        ref(
            db,
            "fixedGame"
        );


    const snapshot =
        await get(gameRef);


    // -----------------------------------------
    // IF GAME ALREADY EXISTS, USE IT
    // -----------------------------------------

    if (snapshot.exists()) {

        console.log(
            "Game already exists."
        );

        return;
    }


    // -----------------------------------------
    // CREATE NEW GAME
    // -----------------------------------------

    console.log(
        "Creating new game..."
    );


    // SHUFFLE ROLES

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


    // -----------------------------------------
    // IMPORTANT:
    // GUESS IS FALSE AT START
    // -----------------------------------------

    await set(
        gameRef,
        {

            teams:
                teamData,

            guessMade:
                false,

            guessedTeam:
                "",

            guessCorrect:
                false
        }
    );


    console.log(
        "New game created successfully."
    );
}


// =====================================================
// LISTEN TO GAME
// =====================================================

function listenToGame() {

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


    // -----------------------------------------
    // CARD OPEN
    // -----------------------------------------

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

    }

    // -----------------------------------------
    // CARD CLOSED
    // -----------------------------------------

    else {

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

                    cardOpen: true
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

                    cardOpen: false
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
    // ONLY RAMUDU CAN SEE THIS SECTION
    // -----------------------------------------

    if (
        myData.role !== "Ramudu"
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
    // IF RAMUDU ALREADY SELECTED
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

            // RAMUDU CANNOT SELECT HIMSELF

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

                    // ---------------------------------
                    // GAME MUST EXIST
                    // ---------------------------------

                    if (!game) {

                        return;
                    }


                    // ---------------------------------
                    // PREVENT SECOND GUESS
                    // ---------------------------------

                    if (
                        game.guessMade === true
                    ) {

                        return;
                    }


                    // ---------------------------------
                    // CHECK CURRENT PLAYER IS RAMUDU
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
                            correct
                    };
                }
            );


        if (
            result.committed
        ) {

            console.log(
                "Seetha selected by Ramudu."
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
    // VERY IMPORTANT:
    // NO RESULT UNTIL RAMUDU MAKES A GUESS
    // -----------------------------------------

    if (
        game.guessMade !== true
    ) {

        resultSection.classList.add(
            "hidden"
        );

        guessResult.textContent = "";

        resultText.innerHTML = "";

        return;
    }


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
    }


    // -----------------------------------------
    // WRONG
    // -----------------------------------------

    else {

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