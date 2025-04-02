const NavBar = () => {

    return (
        <div>
            <li className="flex justify-center text-white gap-5 mt-[25px]">
                <ul className="bg-blue-950 p-1 rounded-lg hover:bg-white hover:text-black px-2">Tree</ul>
                <ul className="bg-blue-950 p-1 rounded-lg hover:bg-white hover:text-black px-2">Hash</ul>
                <ul className="bg-blue-950 p-1 rounded-lg hover:bg-white hover:text-black px-2">LinkedList</ul>
            </li>
        </div>
    )
}

export default NavBar;