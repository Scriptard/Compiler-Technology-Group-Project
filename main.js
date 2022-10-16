const submitButton = document.getElementById("submit");

submitButton.addEventListener("click", parseInput);

function storeGrammarHelper(input) {
  let indexOfFirstDivider = input.indexOf("-");
  let indexOfSecondDivider = input.indexOf(">");
  let grammarInput = input.slice(0, indexOfFirstDivider - 1);
  let grammarOutput = input.slice(indexOfSecondDivider + 2, input.length);

  return {
    input: grammarInput,
    output: grammarOutput,
  };
}

function storeGrammar(input) {
  let storeString = "";
  let grammarArray = [];

  for (let i = 0; i < input.length; i++) {
    if (input[i] === "~") {
      grammarArray.push(storeGrammarHelper(storeString));
      storeString = "";
      i++;
    } else {
      storeString += input[i];
    }
  }

  return grammarArray;
}

const isUpperCase = (string) => /^[A-Z]*$/.test(string);

function canExtraClosureBePerformed(closureArray) {
  let lenOfArray = closureArray.length - 1;
  let lastItem = closureArray[lenOfArray];
  let outputString = lastItem.output;
  let positionOfDot = outputString.indexOf(".");

  if (
    positionOfDot === outputString.length - 1 ||
    !isUpperCase(outputString[positionOfDot + 1])
  ) {
    return false;
  } else {
    return true;
  }
}

function getClosurePushElement(obj, grammarArray) {
  let outputString = obj.output;
  let positionOfDot = outputString.indexOf(".");
  let nextProductionToAdd = outputString[positionOfDot + 1];

  let grammarArrayFind = grammarArray.filter(
    (item) => item.input === nextProductionToAdd
  );

  let closuredArray = grammarArrayFind.map((item) => {
    return {
      input: item.input,
      output: "." + item.output,
    };
  });

  return closuredArray;
}

function performClosure(closureInputArray, grammarArray) {
  let closureReturnOutputArray = [];

  for (let closureElement of closureInputArray) {
    let closureOutputArray = [];
    closureOutputArray.push(closureElement);
    while (canExtraClosureBePerformed(closureOutputArray)) {
      let lenOfArray = closureOutputArray.length - 1;
      let lastItem = closureOutputArray[lenOfArray];
      let closureElementsReceived = getClosurePushElement(
        lastItem,
        grammarArray
      );
      closureOutputArray = closureOutputArray.concat(closureElementsReceived);
    }

    closureReturnOutputArray =
      closureReturnOutputArray.concat(closureOutputArray);
  }

  return closureReturnOutputArray;
}

function findGotoElements(stateElements) {
  let gotoElements = [];

  for (let stateClosuresObj of stateElements) {
    let stateClosureObjOutput = stateClosuresObj.output;
    let positionOfDot = stateClosureObjOutput.indexOf(".");

    if (positionOfDot !== stateClosureObjOutput.length - 1) {
      let goToChar = stateClosureObjOutput[positionOfDot + 1];

      if (!isUpperCase(goToChar)) {
        positionOfDot = positionOfDot + 2;
        while (
          !isUpperCase(stateClosureObjOutput[positionOfDot]) &&
          positionOfDot < stateClosureObjOutput.length
        ) {
          goToChar += stateClosureObjOutput[positionOfDot];
          positionOfDot++;
        }
      }

      if (!gotoElements.includes(goToChar)) {
        gotoElements.push(goToChar);
      }
    }
  }

  return gotoElements;
}

function findStateClosureInput(state, gotoInput) {
  let closureInput = state.stateElements.filter((stateElemObj) => {
    let positionOfDot = stateElemObj.output.indexOf(".");
    let output = stateElemObj.output;
    let goToChar = output[positionOfDot + 1];

    if (!isUpperCase(goToChar)) {
      positionOfDot = positionOfDot + 2;
      while (
        !isUpperCase(output[positionOfDot]) &&
        positionOfDot < output.length
      ) {
        goToChar += output[positionOfDot];
        positionOfDot++;
      }
    }

    return goToChar === gotoInput;
  });

  closureInput = closureInput.map((stateElemObj) => {
    let positionOfDot = stateElemObj.output.indexOf(".");

    return {
      input: stateElemObj.input,
      output:
        stateElemObj.output.slice(0, positionOfDot) +
        stateElemObj.output.slice(
          positionOfDot + 1,
          positionOfDot + 1 + gotoInput.length
        ) +
        "." +
        stateElemObj.output.slice(positionOfDot + gotoInput.length + 1),
    };
  });

  return closureInput;
}

function isStateAlreadyPresent(closureOutput, stateArray) {
  for (let state of stateArray) {
    if (state.stateElements.length === closureOutput.length) {
      let stateEqualCount = 0;
      for (let i = 0; i < closureOutput.length; i++) {
        let stateArrayObj = state.stateElements[i];
        let closureOutputObj = closureOutput[i];

        if (
          stateArrayObj.input === closureOutputObj.input &&
          stateArrayObj.output === closureOutputObj.output
        ) {
          stateEqualCount++;
        }
      }

      if (stateEqualCount === closureOutput.length) {
        return state.stateNo;
      }
    }
  }
  return -1;
}

function isAcceptingState(closureOutput, grammarArray) {
  let acceptingInput = grammarArray[0].input;
  let acceptingOutput = grammarArray[0].output + ".";

  for (let closureObj of closureOutput) {
    if (
      closureObj.input === acceptingInput &&
      closureObj.output === acceptingOutput
    ) {
      return true;
    }
  }

  return false;
}

function isReducingState(closureOutput, grammarArray) {
  let reduceStateArray = closureOutput.filter((state) => {
    return (
      state.output[state.output.length - 1] === "." &&
      state.input !== grammarArray[0].input
    );
  });

  return reduceStateArray.length > 0 ? true : false;
}

function performStateTransition(stateArray, grammarArray) {
  let newStateArray = [];
  newStateArray = newStateArray.concat(stateArray);

  while (newStateArray.length !== 0) {
    let noOfNewStates = 0;
    let newStateFormed = [];

    for (let state of newStateArray) {
      let goToInputs = findGotoElements(state.stateElements);

      for (let goToSymbol of goToInputs) {
        let newState = {
          stateType: "Normal State",
          stateNo: 0,
          stateTransitions: {},
          stateElements: [],
          closureInput: [],
        };

        let closureInputForState = findStateClosureInput(state, goToSymbol);
        let closureOutputAfterGoto = performClosure(
          closureInputForState,
          grammarArray
        );

        newState.closureInput = closureInputForState;
        newState.stateElements = closureOutputAfterGoto;

        let isNewState = isStateAlreadyPresent(
          closureOutputAfterGoto,
          stateArray
        );

        if (isNewState === -1) {
          noOfNewStates++;

          newState.stateNo = stateArray.length - 1 + noOfNewStates;

          state.stateTransitions[goToSymbol] = newState.stateNo;

          // checking whether the state is accepting state or not
          if (isAcceptingState(closureOutputAfterGoto, grammarArray)) {
            newState.stateType = "Accepting State";
          }

          // checking whether the state is reducing state or not
          if (isReducingState(closureOutputAfterGoto, grammarArray)) {
            newState.stateType = "Reducing State";
          }
          newStateFormed.push(newState);
        } else {
          // then add to state transtion of already present state
          state.stateTransitions[goToSymbol] = isNewState;
        }
      }
    }

    newStateArray = newStateFormed;
    stateArray = stateArray.concat(newStateFormed);
  }

  return stateArray;
}

function constructStateArray(grammarArray) {
  let stateArray = [];

  let initialInputArray = [
    {
      input: grammarArray[0].input,
      output: "." + grammarArray[0].output,
    },
  ];

  let initialState = {
    stateType: "Starting State",
    stateNo: 0,
    stateTransitions: {},
    stateElements: performClosure(initialInputArray, grammarArray),
    closureInput: initialInputArray,
  };

  stateArray.push(initialState);
  stateArray = performStateTransition(stateArray, grammarArray);
  return stateArray;
}

function computeFollowForGrammar(grammarArray, terNonTermObj) {
  let followObj = {};

  followObj[grammarArray[0].input] = ["$"];

  for (let toFindFollowTerminal of terNonTermObj.terminals) {
    let followOfTerminal = [];

    let stateContainingTerminal = grammarArray.filter((grammarState) => {
      return grammarState.output.includes(toFindFollowTerminal);
    });

    for (states of stateContainingTerminal) {
      let indexOfTerminal = states.output.indexOf(toFindFollowTerminal);
      if (indexOfTerminal === states.output.length - 1) {
        let followOfInput = followObj[states.input];
        for (let inputChar of followOfInput) {
          if (!followOfTerminal.includes(inputChar)) {
            followOfTerminal.push(inputChar);
          }
        }
      } else {
        // if for follow the input production does not lie in the end of output

        // then it can either be a prouction  or lower case char
        
        // in case of production we need to find First
        let nonTerminalString = states.output[++indexOfTerminal];
        if (!followOfTerminal.includes(nonTerminalString)) {
          followOfTerminal.push(nonTerminalString);
        }
      }
    }

    followObj[toFindFollowTerminal] = followOfTerminal;
  }

  return followObj;
}

function computeTerminalsAndNonTerminals(grammarArray) {
  let obj = {
    nonTerminals: ["$"],
    terminals: [],
  };

  for (let i = 1; i < grammarArray.length; i++) {
    if (!obj.terminals.includes(grammarArray[i].input)) {
      obj.terminals.push(grammarArray[i].input);
    }

    let nonTerminal = "";
    let output = grammarArray[i].output;
    for (let j = 0; j < output.length; j++) {
      if (!isUpperCase(output[j])) {
        nonTerminal += output[j];

        while (!isUpperCase(output[++j]) && j < output.length) {
          nonTerminal += output[j];
        }
        if( !obj.nonTerminals.includes(nonTerminal)) {
          obj.nonTerminals.push(nonTerminal);
        }
        nonTerminal = "";
      }
    }
  }

  return obj;
}

function computeSlrParsingTable(stateArray, followObj, termNonTerObj,grammarArray) {
  let parsingTableArray = [];

  for (let state of stateArray) {
    let pushActionObj = { actions: {}, gotos: {} };
    for (const actions of termNonTerObj.nonTerminals) {
      pushActionObj.actions[actions] = [];
    }

    for (const gotos of termNonTerObj.terminals) {
      pushActionObj.gotos[gotos] = [];
    }

    for (const [key, value] of Object.entries(state.stateTransitions)) {
      if (isUpperCase(key)) {
        pushActionObj.gotos[key].push(value);
      } else {
        pushActionObj.actions[key].push("s" + value);
      }
    }

    if (state.stateType === "Accepting State") {
      pushActionObj.actions["$"].push("Accept");
    } else if (state.stateType === "Reducing State") {
      let arrayOfReduce = state.stateElements.filter((reduceState) => {
        return reduceState.output[reduceState.output.length - 1] === ".";
      });

      let followToFind = arrayOfReduce[0].input;
      let reduceOpToFind = arrayOfReduce[0].output.slice(
        0,
        arrayOfReduce[0].output.length-1
      );
      let reduceNo = grammarArray.findIndex((state) => {
        return state.output === reduceOpToFind;
      });
      let followArray = followObj[followToFind];
      for (let followChar of followArray) {
        pushActionObj.actions[followChar].push("r" + reduceNo);
      }
    }

    parsingTableArray.push(pushActionObj);
  }
  return parsingTableArray;
}

function parseInput() {
  const grammarInput = document.getElementById("grammar-input").value;
  const parsingInput = document.getElementById("parsing-input").value;
  let grammarArray = storeGrammar(grammarInput);
  console.log("grammar array is: ",grammarArray);
  let stateArray = constructStateArray(grammarArray);
  console.log("state array is: ", stateArray);
  let terminalNonTerminalObj = computeTerminalsAndNonTerminals(grammarArray);
  console.log("terminal and non-terminal obj: ",terminalNonTerminalObj);
  let followObj = computeFollowForGrammar(grammarArray, terminalNonTerminalObj);
  console.log("follow object is: ",followObj);
  let slrParsingTable = computeSlrParsingTable(
    stateArray,
    followObj,
    terminalNonTerminalObj,
    grammarArray
  );

  for (let i = 0; i < slrParsingTable.length; i++) {
    console.log("----state is: ", i);
    console.log("actions is: ");
    for (const [key, value] of Object.entries(slrParsingTable[i].actions)) {
      console.log("action input is: ", key, " action output is: ", value);
    }

    console.log("gotos is: ");
    for (const [key, value] of Object.entries(slrParsingTable[i].gotos)) {
      console.log("goto input is: ", key, " goto output is: ", value);
    }
  }
}
