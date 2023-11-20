cron.schedule('59 16 * * 5', async () => { 
    updateWinner = async () => {
        try {
            const scholarship = await Scholarship.findOne().sort({createdAt: -1});
            
            if (scholarship.studentsEntered.length !== 0) {
                const winnerId = scholarship.studentsEntered[Math.floor(Math.random() * scholarship.studentsEntered.length)];
                const winner = await User.findById(winnerId);
                await Scholarship.findByIdAndUpdate(scholarship._id, { winner: winnerId });
                console.log('Winner updated', winner);
                const htmlContent = `
                <h1>Dear, ${winner.name}!</h1>
                <p>We are thrilled to inform you that you have been selected as the winner of our scholarship program. Congratulations! Your dedication and hard work have truly paid off.</p>
                
                <h1 className="text-red"></h1>
                <p>For reference, here's your login information:</p>
                <h3>Email: ${winner.email}</h3>
                <p>If you have any questions or need further assistance, please don't hesitate to reach out to our customer success team. We're here to support you every step of the way.</p>
                <p>Again, congratulations on this remarkable achievement. We look forward to seeing all that you will accomplish with this scholarship.</p>
                <p>Best regards!</p>
                <p>Team dollar4scholar</p>
                <h3>info@dollar4scholar.com</h3>
              `
              const htmlContent2 = `
                <h1>Hello, Admin!</h1>
                <p>I hope this message finds you well. I'm pleased to inform you that we have a winner for the latest scholarship program. Here are the details:</p>
                
                <h1 className="text-red">Winner Details:</h1>
                <h3>Winner's Name: ${winner.name}</h3>
                <h3>Email Address: ${winner.email}</h3>
                <h3>Phone Number: ${winner.phone}</h3>
                <div>
                <p>Please join me in congratulating the winner on their achievement!
                </p>
                <p>If you have any further questions or need additional information, feel free to reach out.
                </p>
                </div>
                <p>Best regards!</p>
                <p>Team dollar4scholar</p>
                <h3>info@dollar4scholar.com</h3>
              `

                await sendEmail(winner.email, winner.name, 'Congratulations on Winning the Scholarship!', htmlContent)
                await sendEmail("info@dollar4scholar.com", "Admin", 'Scholarship Winner Announcement', htmlContent2)

                console.log('Winner updated', winner);
                createNewScholarship();

            } else {
                 // If studentsEntered is empty, add specific user object id
                // Example:
                scholarship.studentsEntered.push('6542dfc5c4341a1d679c1a69');
                const winner = scholarship.studentsEntered[Math.floor(Math.random() * scholarship.studentsEntered.length)];
                await Scholarship.findByIdAndUpdate(scholarship._id, { winner: winner });
                await scholarship.save();
                console.log('No students entered');
                createNewScholarship();
            }
        } catch (error) {
            console.log(error);
        }
    }

createNewScholarship = async () => {
        try {
            const scholarship = new Scholarship({
                pot: 0,
                active: true,
                studentsEntered: [],
                donorContributions: []
            });
            await scholarship.save();
            console.log('New scholarship created!', scholarship);
        } catch (error) {
            console.log(error);
        }
    }

    updateWinner();
}, null, true, 'America/New_York'); // The last argument sets the timezone