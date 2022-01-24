import { createContext, useEffect, useState } from 'react';
import { getLocations, getAccessToken, getAnimals } from '../services/petfinder-api';

export const PetFinderContext = createContext();

export function PetFinderProvider(props) {
    const [userLocation, setUserLocation] = useState();
    const [searchParameters, setSearchParameters] = useState({
        location: '',
        distance: 100,
        type: ''
    });
    const [suggestions, setSuggestions] = useState([]);


    const [token, setToken] = useState();
    const [isSearchStarted, setIsSearchStarted] = useState(false);
    const [searchResults, setSearchResults] = useState();

    useEffect(() => {

        const params = Object.fromEntries(Object.entries(searchParameters).filter(([_, v]) => v !== null && v !== ''));


        if (isSearchStarted) {
            if (token && token.expires_in > Date.now()) {
                getAnimals(token.access_token, 'animals', params)
                    .then(data=> setSearchResults(data));
            } else {
                // get an access token asynchronously
                getAccessToken()
                    // update 'expires_in' value to the relevant timestamp
                    .then(data => ({ ...data, expires_in: Date.now() + data.expires_in * 1000 }))
                    .then(data => setToken((prev)=>({...prev, ...data})))
            }
        }
    }, [isSearchStarted, token])

    const startSearch = () => {
        setIsSearchStarted(true);
    }


    // update search location using controlled input
    const setSearchLocation = (event) => {
        setSearchParameters((prevState) => ({
            ...prevState,
            location: event.target.value
        }));
    }

    // get the list of location suggestions for user input
    useEffect(() => {
        // get suggestions when input more than 2 characters
        searchParameters.location.length > 2
            // fetch request to get allowed locations from PetFinder.com
            && getLocations(searchParameters.location, userLocation.latitude, userLocation.longitude)
                // put 'locations' array from response data to 'suggestions' State
                .then(data => setSuggestions(data.locations))
    }, [searchParameters.location]);

    // define function in global scope to use outside React application:
    // https://stackoverflow.com/questions/55040641/call-react-component-function-from-javascript
    window.getUserLocation = (obj) => {
        setUserLocation(obj)
    };

    // append an external Geolocation Onetrust Script to the component:
    // https://betterprogramming.pub/4-ways-of-adding-external-js-files-in-reactjs-823f85de3668
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://geolocation.onetrust.com/cookieconsentpub/v1/geo/location/getUserLocation';
        script.async = true;
        document.body.appendChild(script);
        return (() => document.body.removeChild(script));
    }, []);

    return (
        <PetFinderContext.Provider value={{ setSearchLocation, searchParameters, suggestions, searchResults, startSearch }}>
            {props.children}
        </PetFinderContext.Provider>
    );
}