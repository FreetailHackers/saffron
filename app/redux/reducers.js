import { combineReducers } from 'redux';
import { TOGGLE_PLAY, SET_TOKEN, SET_DROP_DOWN, SET_USER, SET_USER_AND_TOKEN, SET_TIME, SET_VOLUME, LOAD_STORED_STATE, 
    USERS_REQUEST, USERS_SUCCESS, USERS_FAILURE,
    USER_BY_ID_REQUEST, USER_BY_ID_SUCCESS, USER_BY_ID_FAILURE } from "./actions";

const initialState = {
    playing: false,
    token: null,
    isFetching: false,
    isError: false,
    users: [],
    currentUser: {}
}

function reducer(state = initialState, action) {
    switch(action.type) {
        case SET_TOKEN:
            return Object.assign({}, state, {
                token: action.token,
            })
        case SET_USER:
            return Object.assign({}, state, {
                user: action.user
            })
        case SET_USER_AND_TOKEN:
            return Object.assign({}, state, {
                user: action.user,
                token: action.token,
            })
        case TOGGLE_PLAY:
            return Object.assign({}, state, {
                playing: !state.playing,
            })
        case SET_TIME:
            return Object.assign({}, state, {
                time: action.time,
            })
        case SET_VOLUME:
            return Object.assign({}, state, {
                volume: action.volume,
            })
        case SET_DROP_DOWN:
            return Object.assign({}, state, {
                dropDownOpen: action.dropDownOpen,
            })
        case LOAD_STORED_STATE:
            return action.storedState;
        case USERS_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
                isError: false,
                users: state.users
            })
        case USERS_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false,
                isError: false,
                users: action.payload // Contains the API response body
            })
        case USERS_FAILURE:
            return Object.assign({}, state, {
                isFetching: false,
                isError: true,
                users: null
            })
        case USER_BY_ID_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
                isError: false,
                currentUser: state.currentUser
            })
        case USER_BY_ID_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false,
                isError: false,
                currentUser: action.payload // Contains the API response body
            })
        case USER_BY_ID_FAILURE:
            return Object.assign({}, state, {
                isFetching: false,
                isError: true,
                currentUser: null
            })
        default:
            return state;
    }
}

export default reducer
