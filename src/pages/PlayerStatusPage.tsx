export default function PlayerStatusPage() {
    return (
        <>
            <header className="py-4">
                <nav>
                    <menu className="flex w-screen justify-around text-center">
                        <li className="small-font-size text-orange-200">Grinds</li>
                        <li className="small-font-size text-orange-200">Status</li>
                        <li className="small-font-size text-orange-200">Quests</li>
                    </menu>
                </nav>
            </header>

            <main className="flex flex-col gap-y-4">
                <h1 className="h1-font-size text-center">Status</h1>
                <section aria-labelledby="main-info-heading" className="flex flex-col gap-y-4">
                    <h2 id="main-info-heading" className="h2-font-size info-text-spacing text-orange-100 pb-4 bottom-gradient-border after:from-orange-100">Main Info</h2>
                    <dl className="flex flex-col gap-y-4">
                        <dt className="standard-font-size flex justify-between pb-4 bottom-gradient-border">
                            <p className="info-text-spacing">Player:</p>
                            <p className="info-text-spacing">SolidDavid03</p>
                        </dt>
                        <dt className="standard-font-size flex flex-col gap-y-2 bottom-gradient-border">
                            <p className="info-text-spacing">Stamina</p>
                            <meter max="100" value="75" className="w-screen mb-4"></meter>
                        </dt>

                        <dt className="standard-font-size flex justify-between text-center pb-4 bottom-gradient-border">
                            <p className="info-text-spacing">Level</p>
                            <p className="info-text-spacing">1</p>
                        </dt>
                    </dl>
                </section>

                <section aria-labelledby="attributes-heading" className="flex flex-col gap-y-4">
                    <h2 id="attributes-heading" className="h2-font-size info-text-spacing text-orange-100 pb-4 bottom-gradient-border after:from-orange-100">Attributes</h2>
                    <dl className="flex flex-col gap-y-4">
                        <dt className="standard-font-size grid grid-cols-2 gap-y-2 bottom-gradient-border">
                            <p className="text-start info-text-spacing">Strength</p>
                            <p className="col-span-1 text-end info-text-spacing">1</p>
                            <progress max="100" value="45" className="col-span-full w-full h-3 mb-4"></progress>
                        </dt>
                    </dl>
                    <button className="small-font-size border min-w-56 w-full self-start">Add attribute</button>
                </section>
            </main>
        </> 
    )
}