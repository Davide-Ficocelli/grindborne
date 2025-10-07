import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import strengthIcon from "../assets/icons/attribute-placeholder-icon.webp"

export default function PlayerStatusPage() {
    return (
        <>
            <header className="py-4">
                <nav>
                    <menu className="flex w-screen justify-around text-center">
                        <li className="medium-font-size text-orange-200">Grinds</li>
                        <li className="medium-font-size text-orange-200">Status</li>
                        <li className="medium-font-size text-orange-200">Quests</li>
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
                        <dt className="standard-font-size grid grid-cols-[4rem_1fr_1fr] gap-y-2 bottom-gradient-border">
                            <img src={strengthIcon} className="col-start-1 row-span-1 w-20 info-text-spacing" />
                            <p className="col-start-2 row-span-1 text-start">Strength</p>
                            <p className="col-start-3 row-span-1 text-end info-text-spacing">1</p>
                            <div className="col-span-full w-full relative">
                                <progress max="100" value="45" className="w-full h-3"></progress>
                                <span className="absolute top-3 left-4 w-full text-start text-[0.6rem] leading-none">
                                    45/100
                                </span>
                            </div>
                            <span className="col-span-full small-font-size info-text-spacing mb-4">7 days before XP decaying</span>
                        </dt>
                    </dl>
                    <div className="small-font-size w-50 self-start flex items-center justify-start gap-x-2 ml-4">
                        <FontAwesomeIcon icon={faPlus} className="border-2 rounded-xl p-1" />
                        <p>Add attribute</p>
                    </div>
                </section>
            </main>
        </> 
    )
}