export const getters = {
  isAuthenticated(state) {
    return state.auth.loggedIn
  },

  loggedInUser(state) {
    return state.auth.user
  },

  avatarImage(state) {
    return `${process.env.API_AUTH_URL}${state.auth.user.image.url}`
  }
}
