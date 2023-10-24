import React, { useState, useEffect, useRef } from 'react';
import { FiSearch } from "react-icons/fi";
import algoliasearch from 'algoliasearch/lite';
import './SearchBar.css';

import Axios from 'axios';

const searchClient = algoliasearch('QGXKTHTJGY', '8cd7adea0720a2f9af20cd6ac20f5203');
const index = searchClient.initIndex('searchterms');

const SearchBar = () => {

    const [query, setQuery] = useState('');
    const [hits, setHits] = useState([]);
    const [selectedResult, setSelectedResult] = useState(-1);
    const [searchHistory, setSearchHistory] = useState([]);
    const [isDropdownOpen, setDropdownOpen] = useState(false); // Track if suggestions or history are open
    const [queryChange, setQueryChange] = useState(true); // Flag for search action
    const dropdownRef = useRef(null);

    // Load search history from local storage on component mount
    useEffect(() => {
        const savedHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        setSearchHistory(savedHistory);
    }, []);

    useEffect(() => {
        if (query.trim() === '') {
            setHits([]);
            setDropdownOpen(false);
            return;
        }

        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                // Clicked outside the search bar and dropdown
                setDropdownOpen(false);
            }
        }

        async function fetchSuggestions() {
            if (queryChange) {
                const { hits } = await index.search(query, {
                    hitsPerPage: 10, //limit 10 suggestions per query
                });
                setHits(hits);
            }
        }

        fetchSuggestions();

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, [query]);

    const handleInputChange = async (event) => {
        const userInput = event.target.value;

        setQuery(userInput);

        setDropdownOpen(true); // Open dropdown when input changes
        setSelectedResult(-1);
    };

    // Function to save searches to the search history
    const saveToSearchHistory = (search) => {
        const newSearchHistory = [...searchHistory];
        if (!newSearchHistory.includes(search)) {
            newSearchHistory.push(search);
        }
        setSearchHistory(newSearchHistory);

        //save history
        localStorage.setItem('searchHistory', JSON.stringify(newSearchHistory));
    };

    const deleteSearch = (index) => {
        const updatedHistory = [...searchHistory];
        updatedHistory.splice(index, 1);
        setSearchHistory(updatedHistory);

        //save history
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();

            setSelectedResult((prevIndex) => Math.min(prevIndex + 1, hits.length + searchHistory.length - 1));

        } else if (event.key === 'ArrowUp' && selectedResult > 0) {
            event.preventDefault();

            setSelectedResult((prevIndex) => Math.max(prevIndex - 1, -1));

        } else if (event.key === 'Enter') {
            if (selectedResult >= 0) {
                event.preventDefault();
                setQueryChange(false);

                if (selectedResult < searchHistory.length) {
                    // Handle suggestion selection
                    const selectedHistory = searchHistory[selectedResult];
                    setQuery(selectedHistory);
                } else {
                    // Handle search history selection
                    const selectedSuggestion = hits[selectedResult - searchHistory.length];
                    setQuery(selectedSuggestion.search_term);
                }

                setSelectedResult(-1);

            } else if (query.trim() !== '' && queryChange) {
                // Only perform the search if no item is selected
                setQueryChange(false); // Disable search action

                saveToSearchHistory(query);

                setDropdownOpen(false); // Close dropdown on Enter

                //ADD SEARCH FUNCTION HERE
            }
        } else {
            setQueryChange(true);
        }
    };

    const handleResultClick = (result) => {
        setQueryChange(false);
        // Handle the selection of a result
        setSelectedResult(result);
        setQuery(result.search_term); // Update the query with the selected result
        setSelectedResult(-1);
    };

    const handleClearButtonClick = () => {
        setQuery(''); // Clear the search input
    };

    //search button pressed
    const searchInput = async () => {
        //TODO: implement search function to API
        if (query.trim() !== '') {
            try {
                const response = await Axios.post('http://127.0.0.1:5000/get_price_data', {
                    searchQuery: query,
                });

                console.log(response.data)
            }
            catch (error) {
                console.log(error)
            }

            saveToSearchHistory(query);
        }
    };

    return (
        <div className="SearchContainer" ref={dropdownRef}>
            <input
                onFocus={() => setDropdownOpen(true)}
                type="text"
                placeholder="Search..."
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="SearchInput"
            />
            {query && ( // Render the "Clear" button when there's text in the input
                <button className="clear-button" onClick={handleClearButtonClick}>
                    X
                </button>
            )}
            <button onClick={searchInput} className="SearchButton">
                <FiSearch />
            </button>
            {isDropdownOpen && (
                <ul className="SearchHistory"> {searchHistory.map((search, index) => (
                    <li key={index} className={`HistoryList ${index === selectedResult ? 'selected' : ''}`}
                        onClick={() => setQuery(search)}> {String(search)}
                        <button onClick={(e) => {
                            e.stopPropagation(); //ensures that the click event from the li above is stopped at this button
                            deleteSearch(index);
                        }}>X</button>
                    </li>
                ))}
                </ul>
            )}
            {isDropdownOpen && (
                <ul className="SearchSuggestions">
                    {hits.map((hit, index) => (
                        <li key={hit.objectID} className={index === selectedResult - searchHistory.length ? 'selected' : ''} onClick={() => handleResultClick(hit)}>
                            {hit.search_term}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchBar;