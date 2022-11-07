// local
import { User } from "../interfaces/user";

/**
 * Pass when attempting to make a vault that doesn't exist
 */
export const createUserStatePASS = async (user: User) => {
  // initialize user state account on chain
  console.log("getting user state acct");
  const userState = user.userState;

  // if not created, create user vault
  if (!(await userState.isAccountCreated())) {
    const confirmation = await userState.createUserState();
    console.log("created user state: ", confirmation);
  } else console.log("User state already created");
};
